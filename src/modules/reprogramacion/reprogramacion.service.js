const pool = require("../../database/pool");
const repository = require("./reprogramacion.repository");

function crearError(message, statusCode = 400, code = "ERROR_REPROGRAMACION") {
	const error = new Error(message);
	error.statusCode = statusCode;
	error.code = code;
	return error;
}

function validarId(value, campo = "reservaId") {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw crearError(`${campo} no es válido.`, 400, "ID_INVALIDO");
	}
	return id;
}

function validarFecha(fecha) {
	if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
		throw crearError(
			"La fecha debe tener el formato AAAA-MM-DD.",
			400,
			"FECHA_INVALIDA",
		);
	}
	const d = new Date(`${fecha}T12:00:00-04:00`);
	if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) {
		throw crearError("La fecha indicada no existe.", 400, "FECHA_INVALIDA");
	}
	return fecha;
}

function minutos(hora) {
	const [h, m, s = "0"] = String(hora).split(":");
	return Number(h) * 60 + Number(m) + Number(s) / 60;
}

function fechaHoraBolivia(fecha, hora) {
	return new Date(
		`${String(fecha).slice(0, 10)}T${String(hora).slice(0, 8)}-04:00`,
	);
}

async function obtenerContexto(client, token, reservaId, lock = false) {
	if (!token || typeof token !== "string") {
		throw crearError(
			"Debes iniciar sesión para continuar.",
			401,
			"CLIENTE_NO_AUTENTICADO",
		);
	}
	const cliente = await repository.getClienteByToken(client, token);
	if (!cliente)
		throw crearError(
			"La sesión del cliente no es válida.",
			401,
			"TOKEN_INVALIDO",
		);

	const reserva = await repository.getReservaParaReprogramar(
		client,
		reservaId,
		cliente.id,
		lock,
	);
	if (!reserva)
		throw crearError(
			"No se encontró la reserva o no pertenece a tu cuenta.",
			404,
			"RESERVA_NO_ENCONTRADA",
		);
	return { cliente, reserva };
}

async function validarElegibilidad(client, reserva, clienteId) {
	// 1. Solo se permiten reservas pendientes o confirmadas.
	if (!["PENDIENTE", "CONFIRMADA"].includes(reserva.estado)) {
		throw crearError(
			"Solo se pueden reprogramar reservas pendientes o confirmadas.",
			409,
			"ESTADO_NO_PERMITE_REPROGRAMAR",
		);
	}

	// 2. No permitir reprogramar una reserva que ya fue reprogramada.
	const yaReprogramada =
		reserva.ya_reprogramada === true ||
		reserva.ya_reprogramada === "true" ||
		(await repository.existeReprogramacionPosterior(client, reserva.id));

	if (yaReprogramada) {
		throw crearError(
			"Esta reserva ya fue reprogramada y no puede volver a reprogramarse.",
			409,
			"RESERVA_YA_REPROGRAMADA",
		);
	}

	// 3. La cita original debe estar en el futuro.
	const ahora = new Date();
	const inicioOriginal = fechaHoraBolivia(reserva.fecha, reserva.hora_inicio);

	if (Number.isNaN(inicioOriginal.getTime()) || inicioOriginal <= ahora) {
		throw crearError(
			"No se puede reprogramar una reserva que ya comenzó o pasó.",
			409,
			"RESERVA_PASADA",
		);
	}

	// 4. Consultar las condiciones asociadas al servicio.
	const condiciones = await repository.getCondicionesServicio(
		client,
		reserva.servicio_id,
	);

	// Si hay condiciones, todas deben permitir reprogramar.
	const noPermitida = condiciones.find((condicion) => {
		const permite = condicion.permite_reprogramar;

		return permite !== true && permite !== "true";
	});

	if (noPermitida) {
		throw crearError(
			`La condición "${noPermitida.nombre}" no permite reprogramar este servicio.`,
			409,
			"REPROGRAMACION_NO_PERMITIDA",
		);
	}

	// 5. Obtener los límites de anticipación configurados.
	const limites = condiciones.map((condicion) => {
		const valor = condicion.limite_horas_reprogramacion;

		// Una condición sin límite definido no aporta un límite.
		if (valor === null || valor === undefined || valor === "") {
			return null;
		}

		const limite = Number(valor);

		// No ignorar silenciosamente un límite inválido.
		if (!Number.isFinite(limite) || limite < 0) {
			throw crearError(
				`La condición "${condicion.nombre}" tiene un límite de reprogramación inválido.`,
				409,
				"LIMITE_REPROGRAMACION_INVALIDO",
			);
		}

		return limite;
	});

	const limitesConfigurados = limites.filter((limite) => limite !== null);

	// 6. Aplicar el límite más restrictivo.
	if (limitesConfigurados.length > 0) {
		const limiteHoras = Math.max(...limitesConfigurados);

		const horasRestantes =
			(inicioOriginal.getTime() - ahora.getTime()) / 3600000;

		if (horasRestantes < limiteHoras) {
			throw crearError(
				`No puedes reprogramar esta reserva. Debes hacerlo con al menos ${limiteHoras} horas de anticipación.`,
				409,
				"FUERA_DE_PLAZO",
			);
		}
	}

	// 7. Devolver las condiciones validadas.
	return condiciones;
}

function crearCombinaciones(slots, duracionServicio) {
	const disponibles = slots.filter(
		(s) => s.slot_estado === "DISPONIBLE" && !s.reservado && !s.bloqueado,
	);
	const combinaciones = [];
	for (let i = 0; i < disponibles.length; i += 1) {
		const grupo = [disponibles[i]];
		let total =
			Number(disponibles[i].duracion) ||
			minutos(disponibles[i].hora_fin) - minutos(disponibles[i].hora_inicio);
		for (
			let j = i + 1;
			j < disponibles.length && total < duracionServicio;
			j += 1
		) {
			const anterior = grupo[grupo.length - 1];
			const actual = disponibles[j];
			if (minutos(actual.hora_inicio) !== minutos(anterior.hora_fin)) break;
			grupo.push(actual);
			total +=
				Number(actual.duracion) ||
				minutos(actual.hora_fin) - minutos(actual.hora_inicio);
		}
		if (total === Number(duracionServicio)) {
			combinaciones.push({
				fecha: null,
				hora_inicio: grupo[0].hora_inicio,
				hora_fin: grupo[grupo.length - 1].hora_fin,
				duracion: total,
				slots_reserva: grupo.map((s) => Number(s.slot_id)),
			});
		}
	}
	return combinaciones;
}

async function getCondiciones({ token, reservaId }) {
	const id = validarId(reservaId);
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const { reserva } = await obtenerContexto(client, token, id);

		const condiciones = await validarElegibilidad(client, reserva);

		const slotsOriginales = await repository.getSlotsOriginales(client, id);

		// Recuperar los importes de la reserva original.
		const precioOriginal = Number(reserva.precio_original ?? 0);
		const montoPromocion = Number(reserva.monto_promocion ?? 0);
		const montoDescuento = Number(reserva.monto_descuento ?? 0);

		const precioAplicable = Number(
			reserva.precio_aplicable ??
				precioOriginal - montoDescuento - montoPromocion,
		);

		const montoPagado = Number(reserva.monto_pagado ?? 0);

		const saldo = Number(
			reserva.saldo ?? Math.max(0, precioAplicable - montoPagado),
		);

		const reservaOriginal = {
			reserva_id: Number(reserva.id),
			numero: Number(reserva.numero),
			estado: reserva.estado,
			fecha: reserva.fecha,
			hora_inicio: reserva.hora_inicio,
			hora_fin: reserva.hora_fin,

			precio_original: precioOriginal,
			monto_promocion: montoPromocion,
			monto_descuento: montoDescuento,
			precio_aplicable: precioAplicable,
			monto_pagado: montoPagado,
			saldo,

			condiciones,

			servicio: {
				id: Number(reserva.servicio_id),
				nombre: reserva.servicio_nombre,
				descripcion: reserva.servicio_descripcion || "",
				duracion: Number(reserva.servicio_duracion),
				precio: Number(reserva.servicio_precio ?? precioOriginal),
				foto: reserva.servicio_foto || null,
			},

			profesional: {
				id: Number(reserva.profesional_id_real ?? reserva.profesional_id),
				nombre: reserva.profesional_nombre,
				foto: reserva.profesional_foto || null,
				slug: reserva.profesional_slug || null,
				calificacion_promedio: Number(
					reserva.profesional_calificacion_promedio ?? 0,
				),
				total_resenas: Number(reserva.profesional_total_resenas ?? 0),
				tipo: "Profesional de belleza",
			},

			slots_actuales: slotsOriginales.map((slot) => ({
				slot_id: Number(slot.slot_id),
				hora_inicio: slot.hora_inicio,
				hora_fin: slot.hora_fin,
				orden: Number(slot.orden),
			})),

			puede_reprogramar: true,
		};

		await client.query("COMMIT");

		return reservaOriginal;
	} catch (error) {
		try {
			await client.query("ROLLBACK");
		} catch (_) {}

		throw error;
	} finally {
		client.release();
	}
}

async function getDisponibilidad({ token, reservaId, fecha }) {
	const id = validarId(reservaId);
	const fechaValida = validarFecha(fecha);
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const { reserva } = await obtenerContexto(client, token, id);

		await validarElegibilidad(client, reserva);

		const slots = await repository.getSlotsFecha(
			client,
			reserva.profesional_id,
			fechaValida,
			id,
		);

		// Fecha y hora actuales de Bolivia.
		const ahora = new Date();
		const inicioDia = fechaHoraBolivia(fechaValida, "00:00:00");

		const esHoy =
			inicioDia.toDateString() ===
			new Date(ahora.getTime() - 4 * 3600000).toDateString();

		// No mostrar horarios que ya pasaron si la fecha seleccionada es hoy.
		const slotsFiltrados = esHoy
			? slots.filter(
					(s) => fechaHoraBolivia(fechaValida, s.hora_inicio) > ahora,
				)
			: slots;

		// Generar combinaciones únicamente con horarios realmente disponibles.
		const slotsLibres = slotsFiltrados.filter(
			(s) => s.slot_estado === "DISPONIBLE" && !s.reservado && !s.bloqueado,
		);

		const combinaciones = crearCombinaciones(
			slotsLibres,
			Number(reserva.servicio_duracion),
		).map((c) => ({
			...c,
			fecha: fechaValida,
			estado: "DISPONIBLE",
			seleccionable: true,
		}));

		await client.query("COMMIT");

		return {
			reserva_id: id,
			fecha: fechaValida,
			duracion_servicio: Number(reserva.servicio_duracion),

			slots: slotsFiltrados.map((s) => {
				const miReserva = s.mi_reserva === true;
				const reservado = s.reservado === true;
				const bloqueado = s.bloqueado === true;

				return {
					id: Number(s.slot_id),
					hora_inicio: s.hora_inicio,
					hora_fin: s.hora_fin,
					duracion: Number(s.duracion),

					// Identifica expresamente el horario de la reserva original.
					mi_reserva: miReserva,

					reservado,
					bloqueado,

					disponible:
						!miReserva &&
						s.slot_estado === "DISPONIBLE" &&
						!reservado &&
						!bloqueado,
				};
			}),

			horarios_disponibles: combinaciones,
		};
	} catch (error) {
		try {
			await client.query("ROLLBACK");
		} catch (_) {}

		throw error;
	} finally {
		client.release();
	}
}

async function confirmarReprogramacion({
	token,
	reservaId,
	fecha,
	slotsReserva,
}) {
	const id = validarId(reservaId, "reservaId");
	const fechaValida = validarFecha(fecha);
	if (!Array.isArray(slotsReserva) || slotsReserva.length === 0) {
		throw crearError(
			"Debes seleccionar los horarios para la nueva reserva.",
			400,
			"SLOTS_REQUERIDOS",
		);
	}
	const slotIds = slotsReserva.map((value) => validarId(value, "slotId"));
	if (new Set(slotIds).size !== slotIds.length) {
		throw crearError(
			"La selección contiene horarios duplicados.",
			400,
			"SLOTS_DUPLICADOS",
		);
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const { reserva } = await obtenerContexto(client, token, id, true);
		await validarElegibilidad(client, reserva);

		const slots = await repository.getSlotsSeleccionados(
			client,
			slotIds,
			reserva.profesional_id,
			fechaValida,
			id,
		);
		if (slots.length !== slotIds.length) {
			throw crearError(
				"Uno o más horarios no pertenecen al profesional o no corresponden a la fecha.",
				409,
				"SLOTS_INVALIDOS",
			);
		}
		if (
			slots.some(
				(s) => s.slot_estado !== "DISPONIBLE" || s.reservado || s.bloqueado,
			)
		) {
			throw crearError(
				"Uno o más horarios ya no están disponibles. Actualiza la agenda e inténtalo nuevamente.",
				409,
				"SLOTS_NO_DISPONIBLES",
			);
		}

		const ordenados = [...slots].sort(
			(a, b) => minutos(a.hora_inicio) - minutos(b.hora_inicio),
		);
		const duracion = ordenados.reduce(
			(sum, s) =>
				sum +
				(Number(s.duracion) || minutos(s.hora_fin) - minutos(s.hora_inicio)),
			0,
		);
		if (duracion !== Number(reserva.servicio_duracion)) {
			throw crearError(
				"Los horarios seleccionados no coinciden con la duración del servicio.",
				400,
				"DURACION_INCORRECTA",
			);
		}
		for (let i = 1; i < ordenados.length; i += 1) {
			if (
				minutos(ordenados[i - 1].hora_fin) !== minutos(ordenados[i].hora_inicio)
			) {
				throw crearError(
					"Los horarios seleccionados deben ser consecutivos.",
					400,
					"SLOTS_NO_CONSECUTIVOS",
				);
			}
		}
		if (fechaHoraBolivia(fechaValida, ordenados[0].hora_inicio) <= new Date()) {
			throw crearError(
				"No puedes seleccionar un horario que ya pasó.",
				409,
				"HORARIO_PASADO",
			);
		}

		// Desactivar los antiguos dentro de la transacción permite conservar el índice único
		// de reserva_slot activo. Si algo falla, ROLLBACK restaura los slots originales.
		await repository.desactivarSlotsOriginales(client, id);
		const numero = await repository.generarNumeroReserva(client);
		const nueva = await repository.crearReserva(
			client,
			reserva,
			numero,
			fechaValida,
			ordenados[0].hora_inicio,
			ordenados[ordenados.length - 1].hora_fin,
		);
		for (let i = 0; i < ordenados.length; i += 1) {
			await repository.crearReservaSlot(
				client,
				nueva.id,
				Number(ordenados[i].slot_id),
				i + 1,
			);
		}
		await repository.crearHistorial(client, nueva.id);
		await repository.crearRelacionReprogramacion(
			client,
			id,
			nueva.id,
			fechaValida,
			ordenados[0].hora_inicio,
		);
		const resultado = await repository.getReservaResultado(client, nueva.id);
		await client.query("COMMIT");
		return {
			reserva_original_id: id,
			reserva_nueva: {
				...resultado,
				id: Number(resultado.id),
				numero: Number(resultado.numero),
				fecha: resultado.fecha,
				hora_inicio: resultado.hora_inicio,
				hora_fin: resultado.hora_fin,
				precio_original: Number(resultado.precio_original),
				monto_promocion: Number(resultado.monto_promocion),
				monto_descuento: Number(resultado.monto_descuento),
				precio_aplicable: Number(resultado.precio_aplicable),
				monto_pagado: Number(resultado.monto_pagado),
				saldo: Number(resultado.saldo),
			},
			pago_reutilizado: true,
		};
	} catch (error) {
		try {
			await client.query("ROLLBACK");
		} catch (_) {}
		throw error;
	} finally {
		client.release();
	}
}

module.exports = { getCondiciones, getDisponibilidad, confirmarReprogramacion };
