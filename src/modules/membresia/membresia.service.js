const pool = require("../../database/pool");
const repository = require("./membresia.repository");

async function getMembresiasByProfesionalId(profesionalId) {
	if (!profesionalId || !Number.isInteger(Number(profesionalId))) {
		throw new Error("El profesional autenticado no es válido");
	}

	const membresias = await repository.getMembresiasByProfesionalId(
		Number(profesionalId),
	);
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);

	return membresias.map((membresia) => {
		const fechaFin = new Date(
			`${String(membresia.fecha_fin).slice(0, 10)}T00:00:00`,
		);
		const diasRestantes = Math.ceil(
			(fechaFin.getTime() - hoy.getTime()) / 86400000,
		);
		let estadoVencimiento;
		if (diasRestantes < 0) estadoVencimiento = "VENCIDA";
		else if (diasRestantes <= 3) estadoVencimiento = "POR_VENCER";
		else estadoVencimiento = "VIGENTE";

		return {
			...membresia,
			monto: Number(membresia.monto),
			dias_restantes: diasRestantes,
			estado_vencimiento: estadoVencimiento,
		};
	});
}

async function getQrGerenciaMembresia() {
	const qr = await repository.getQrGerenciaMembresia();
	if (!qr?.url) {
		const error = new Error(
			"No existe un QR_MEMBRESIA asociado a una gerencia activa",
		);
		error.status = 404;
		throw error;
	}
	return qr;
}

function fechaISO(fecha) {
	return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function convertirFecha(valor) {
	const texto = String(valor).slice(0, 10);
	const [anio, mes, dia] = texto.split("-").map(Number);
	return new Date(anio, mes - 1, dia);
}

function sumarDiasISO(valor, dias) {
	const texto = String(valor).slice(0, 10);
	const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (!coincidencia) {
		throw new Error(
			`La fecha de vencimiento no tiene formato YYYY-MM-DD: ${String(valor)}`,
		);
	}

	const anio = Number(coincidencia[1]);
	const mes = Number(coincidencia[2]);
	const dia = Number(coincidencia[3]);

	const fecha = new Date(Date.UTC(anio, mes - 1, dia));

	if (
		fecha.getUTCFullYear() !== anio ||
		fecha.getUTCMonth() !== mes - 1 ||
		fecha.getUTCDate() !== dia
	) {
		throw new Error(`La fecha de vencimiento no es válida: ${texto}`);
	}

	fecha.setUTCDate(fecha.getUTCDate() + Number(dias));

	return [
		fecha.getUTCFullYear(),
		String(fecha.getUTCMonth() + 1).padStart(2, "0"),
		String(fecha.getUTCDate()).padStart(2, "0"),
	].join("-");
}

function normalizarFecha(valor) {
	if (valor instanceof Date) {
		if (Number.isNaN(valor.getTime())) {
			throw new Error("La fecha recibida no es válida.");
		}

		return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
	}

	if (typeof valor === "string") {
		const texto = valor.trim();
		const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

		if (coincidencia) {
			return new Date(
				Number(coincidencia[1]),
				Number(coincidencia[2]) - 1,
				Number(coincidencia[3]),
			);
		}
	}

	const fecha = new Date(valor);

	if (Number.isNaN(fecha.getTime())) {
		throw new Error(`Fecha de membresía inválida: ${String(valor)}`);
	}

	return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarMesCalendario(valor) {
	let fechaBase;

	if (valor instanceof Date) {
		fechaBase = new Date(
			valor.getFullYear(),
			valor.getMonth(),
			valor.getDate(),
		);
	} else if (typeof valor === "string") {
		const texto = valor.trim();
		const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

		if (coincidencia) {
			fechaBase = new Date(
				Number(coincidencia[1]),
				Number(coincidencia[2]) - 1,
				Number(coincidencia[3]),
			);
		} else {
			fechaBase = new Date(texto);
		}
	} else {
		fechaBase = new Date(valor);
	}

	if (Number.isNaN(fechaBase.getTime())) {
		throw new Error(
			`Fecha inválida para calcular la membresía: ${String(valor)}`,
		);
	}

	const diaOriginal = fechaBase.getDate();

	const siguienteMes = new Date(
		fechaBase.getFullYear(),
		fechaBase.getMonth() + 1,
		1,
	);

	const ultimoDiaMes = new Date(
		siguienteMes.getFullYear(),
		siguienteMes.getMonth() + 1,
		0,
	).getDate();

	siguienteMes.setDate(Math.min(diaOriginal, ultimoDiaMes));

	return siguienteMes;
}

async function renovarMembresia(membresiaId, profesionalId) {
	if (!Number.isInteger(Number(membresiaId)) || Number(membresiaId) <= 0) {
		const error = new Error("El identificador de membresía no es válido");
		error.status = 400;
		throw error;
	}
	if (!Number.isInteger(Number(profesionalId)) || Number(profesionalId) <= 0) {
		const error = new Error("El profesional autenticado no es válido");
		error.status = 403;
		throw error;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const membresiaSolicitada = await repository.getMembresiaParaRenovar(
			client,
			Number(membresiaId),
			Number(profesionalId),
		);
		if (!membresiaSolicitada) {
			const error = new Error(
				"La membresía no existe o no pertenece a este profesional",
			);
			error.status = 404;
			throw error;
		}
		if (!membresiaSolicitada.estado_pagado) {
			const error = new Error(
				"Esta membresía tiene un período sin pagar. Debes resolver ese pago antes de renovar.",
			);
			error.status = 409;
			throw error;
		}

		// Serializa renovaciones concurrentes sobre la misma relación profesional-negocio.
		await client.query(
			"SELECT id FROM profesional_negocio WHERE id = $1 FOR UPDATE",
			[membresiaSolicitada.profesional_negocio_id],
		);

		const pendiente = await repository.existePeriodoPendiente(
			client,
			membresiaSolicitada.profesional_negocio_id,
		);
		if (pendiente) {
			const error = new Error(
				"Ya existe un período pendiente de pago para este negocio",
			);
			error.status = 409;
			throw error;
		}

		const ultimaMembresia = await repository.getUltimaMembresia(
			client,
			membresiaSolicitada.profesional_negocio_id,
		);
		if (!ultimaMembresia) {
			const error = new Error("No existe un período para renovar");
			error.status = 404;
			throw error;
		}
		if (Number(ultimaMembresia.id) !== Number(membresiaSolicitada.id)) {
			const error = new Error(
				"Debes renovar desde el período más reciente de esta membresía",
			);
			error.status = 409;
			throw error;
		}

		const metodoQR = await repository.getMetodoPagoQR(client);
		if (!metodoQR) {
			const error = new Error("No existe un método de pago QR activo");
			error.status = 409;
			throw error;
		}

		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);
		const fechaFinAnterior = convertirFecha(ultimaMembresia.fecha_fin);
		const fechaInicio =
			fechaFinAnterior >= hoy
				? new Date(
						fechaFinAnterior.getFullYear(),
						fechaFinAnterior.getMonth(),
						fechaFinAnterior.getDate() + 1,
					)
				: hoy;

		const siguienteMes = sumarMesCalendario(fechaInicio);
		const fechaFin = new Date(
			siguienteMes.getFullYear(),
			siguienteMes.getMonth(),
			siguienteMes.getDate() - 1,
		);
		const fechaInicioISO = fechaISO(fechaInicio);
		const fechaFinISO = fechaISO(fechaFin);
		const monto = Number(ultimaMembresia.monto);

		if (!Number.isFinite(monto) || monto <= 0) {
			const error = new Error("El monto de la membresía no es válido");
			error.status = 409;
			throw error;
		}

		const nuevaMembresia = await repository.createPeriodoMembresia(client, {
			profesionalNegocioId: membresiaSolicitada.profesional_negocio_id,
			fechaInicio: fechaInicioISO,
			fechaFin: fechaFinISO,
			monto,
		});

		const ahora = new Date();
		const numeroPago = `MEM-${fechaISO(ahora).replace(/-/g, "")}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		const nuevoPago = await repository.createPagoMembresia(client, {
			metodoPagoId: metodoQR.id,
			profesionalId: Number(profesionalId),
			membresiaId: nuevaMembresia.id,
			numero: numeroPago,
			fecha: fechaISO(ahora),
			hora: [
				String(ahora.getHours()).padStart(2, "0"),
				String(ahora.getMinutes()).padStart(2, "0"),
				String(ahora.getSeconds()).padStart(2, "0"),
			].join(":"),
			monto,
		});

		await client.query("COMMIT");
		return { membresia: nuevaMembresia, pago: nuevoPago };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

async function enviarComprobanteRenovacion(
	membresiaOrigenId,
	profesionalId,
	file,
) {
	if (
		!Number.isInteger(Number(membresiaOrigenId)) ||
		Number(membresiaOrigenId) <= 0
	) {
		const error = new Error("El identificador de la membresía no es válido.");
		error.status = 400;
		throw error;
	}

	if (!file) {
		const error = new Error("Debes adjuntar el comprobante de pago.");
		error.status = 400;
		throw error;
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// La membresía de origen debe pertenecer al profesional.
		const origen = await repository.getMembresiaParaRenovar(
			client,
			Number(membresiaOrigenId),
			Number(profesionalId),
		);

		if (!origen) {
			const error = new Error("No se encontró la membresía.");
			error.status = 404;
			throw error;
		}

		if (origen.estado_pagado !== true) {
			const error = new Error(
				"Solo puedes renovar una membresía que ya fue pagada.",
			);
			error.status = 409;
			throw error;
		}

		// Impide generar períodos duplicados para el mismo negocio.
		const pendiente = await repository.existePeriodoPendiente(
			client,
			origen.profesional_negocio_id,
		);

		if (pendiente) {
			const error = new Error(
				"Ya existe una membresía pendiente de pago o validación para este negocio.",
			);
			error.status = 409;
			throw error;
		}

		// La membresía seleccionada debe ser el último período.
		const ultima = await repository.getUltimaMembresia(
			client,
			origen.profesional_negocio_id,
		);

		if (!ultima || Number(ultima.id) !== Number(origen.id)) {
			const error = new Error(
				"Solo puedes renovar el período más reciente de esta membresía.",
			);
			error.status = 409;
			throw error;
		}

		const metodo = await repository.getMetodoPagoQR(client);

		if (!metodo) {
			const error = new Error("No existe un método de pago QR activo.");
			error.status = 400;
			throw error;
		}

		// Calcula el período nuevo sin modificar el período anterior.
		const hoy = new Date();
		const hoyISO = [
			hoy.getFullYear(),
			String(hoy.getMonth() + 1).padStart(2, "0"),
			String(hoy.getDate()).padStart(2, "0"),
		].join("-");

		const fechaFinAnterior =
			ultima.fecha_fin instanceof Date
				? fechaISO(ultima.fecha_fin)
				: String(ultima.fecha_fin).slice(0, 10);

		if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaFinAnterior)) {
			throw new Error(
				`Fecha de vencimiento inválida recibida de PostgreSQL: ${String(ultima.fecha_fin)}`,
			);
		}
		const fechaInicio =
			fechaFinAnterior >= hoyISO ? sumarDiasISO(fechaFinAnterior, 1) : hoyISO;

		// fechaInicio es una cadena YYYY-MM-DD.
		// La función devuelve un Date correspondiente al mes siguiente.
		console.log("[RENOVACIÓN] fechaInicio:", fechaInicio);
		console.log("[RENOVACIÓN] tipo:", typeof fechaInicio);

		const siguienteMes = sumarMesCalendario(fechaInicio);

		console.log("[RENOVACIÓN] siguienteMes:", siguienteMes);

		// El período termina el día anterior al mismo día del mes siguiente.
		const fechaFinDate = new Date(
			siguienteMes.getFullYear(),
			siguienteMes.getMonth(),
			siguienteMes.getDate() - 1,
		);

		// PostgreSQL recibe las fechas en formato YYYY-MM-DD.
		const fechaFin = fechaISO(fechaFinDate);

		const monto = Number(ultima.monto);

		if (!Number.isFinite(monto) || monto <= 0) {
			const error = new Error("El monto de la membresía no es válido.");
			error.status = 400;
			throw error;
		}

		// 1. Crear el nuevo período sin marcarlo pagado.
		const membresia = await repository.createPeriodoMembresia(client, {
			profesionalNegocioId: origen.profesional_negocio_id,
			fechaInicio,
			fechaFin,
			monto,
		});

		// 2. Crear el pago asociado al nuevo período.
		const ahora = new Date();
		const numeroPago = `MEM-${ahora.getTime()}-${Math.floor(Math.random() * 10000)}`;

		const pago = await repository.createPagoMembresia(client, {
			metodoPagoId: metodo.id,
			profesionalId: Number(profesionalId),
			membresiaId: membresia.id,
			numero: numeroPago,
			fecha: hoyISO,
			hora: ahora.toTimeString().slice(0, 8),
			monto,
		});

		// 3. Guardar el archivo y crear el comprobante pendiente.
		const archivo = await repository.createArchivoComprobante(client, file);

		const comprobante = await repository.createComprobantePendiente(
			client,
			pago.id,
			archivo.id,
		);

		await client.query("COMMIT");

		return {
			membresia,
			pago,
			comprobante,
			archivo: {
				id: archivo.id,
				nombre: archivo.nombre,
				url: archivo.url,
			},
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

module.exports = {
	getMembresiasByProfesionalId,
	getQrGerenciaMembresia,
	renovarMembresia,
	enviarComprobanteRenovacion,
};
