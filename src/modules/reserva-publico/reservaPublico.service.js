const { emitirNotificacionProfesional } = require("../../utils/socket");

// =====================================================
// reservaPublico.service.js
// =====================================================

const pool = require("../../database/pool");

const repository = require("./reservaPublico.repository");
const descuentoRepository = require("../descuento-cliente/descuentoCliente.repository");
const notificacionRepository = require("../notificacion/notificacion.repository");

// =====================================================
// UTILIDADES
// =====================================================

function crearError(message, statusCode = 400, code = "ERROR") {
	const error = new Error(message);

	error.statusCode = statusCode;
	error.code = code;

	return error;
}

function horaAMinutos(hora) {
	if (!hora) {
		return 0;
	}

	const [horas, minutos, segundos = 0] = String(hora).split(":").map(Number);

	return horas * 60 + minutos + Math.floor(segundos / 60);
}

function mismaFechaFormato(fecha) {
	return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

// =====================================================
// CONFIRMAR RESERVA
// =====================================================

async function confirmReservation({
	reserva,
	pago,
	condicion,
	comprobante,
	token,
}) {
	const client = await pool.connect();

	try {
		// ===================================================
		// TOKEN
		// ===================================================

		if (!token) {
			throw crearError(
				"El cliente no está autenticado.",
				401,
				"CLIENTE_NO_AUTENTICADO",
			);
		}

		// ===================================================
		// INICIAR TRANSACCION
		// ===================================================

		await client.query("BEGIN");

		// ===================================================
		// CLIENTE REAL
		// ===================================================

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			throw crearError(
				"El token del cliente no es válido.",
				401,
				"TOKEN_INVALIDO",
			);
		}

		/*
		 * IMPORTANTE:
		 *
		 * Ignoramos reserva.cliente_id para determinar
		 * quién está creando realmente la reserva.
		 */

		const clienteId = Number(cliente.id);

		// ===================================================
		// VALIDAR FECHA
		// ===================================================

		if (!mismaFechaFormato(reserva.fecha)) {
			throw crearError(
				"La fecha de la reserva no es válida.",
				400,
				"FECHA_INVALIDA",
			);
		}

		// ===================================================
		// SERVICIO REAL
		// ===================================================

		const informacionServicio = await repository.getServicioReserva(
			client,
			Number(reserva.servicio_id),
		);

		if (!informacionServicio) {
			throw crearError(
				"El servicio no existe o ya no está disponible.",
				404,
				"SERVICIO_NO_DISPONIBLE",
			);
		}

		const servicio = informacionServicio.servicio;

		const profesional = informacionServicio.profesional;

		const condicionReal = informacionServicio.condicion;

		// ===================================================
		// SLOTS
		// ===================================================

		const slotsIds = [
			...new Set(reserva.slots_reserva.map((id) => Number(id))),
		];

		if (!slotsIds.length) {
			throw crearError(
				"No se recibieron slots para la reserva.",
				400,
				"SLOTS_INVALIDOS",
			);
		}

		// ===================================================
		// BLOQUEAR SLOTS
		// ===================================================

		const slots = await repository.getSlotsForReservation(
			client,
			slotsIds,
			servicio.profesional_id,
			reserva.fecha,
		);

		// ===================================================
		// TODOS LOS SLOTS EXISTEN
		// ===================================================

		if (slots.length !== slotsIds.length) {
			throw crearError(
				"Uno o más horarios ya no están disponibles.",
				409,
				"SLOTS_NO_VALIDOS",
			);
		}

		// ===================================================
		// ORDENAR
		// ===================================================

		slots.sort(
			(a, b) => horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio),
		);

		// ===================================================
		// VALIDAR DISPONIBILIDAD
		// ===================================================

		for (const slot of slots) {
			if (
				slot.slot_estado !== "DISPONIBLE" ||
				slot.reservado === true ||
				slot.bloqueado === true
			) {
				throw crearError(
					`El horario ${slot.hora_inicio} ya no está disponible.`,
					409,
					"SLOT_OCUPADO",
				);
			}
		}

		// ===================================================
		// VALIDAR CONTINUIDAD
		// ===================================================
		for (let i = 1; i < slots.length; i++) {
			const anterior = slots[i - 1];
			const actual = slots[i];

			if (
				horaAMinutos(anterior.hora_fin) !== horaAMinutos(actual.hora_inicio)
			) {
				throw crearError(
					"Los horarios seleccionados no son consecutivos.",
					400,
					"SLOTS_NO_CONSECUTIVOS",
				);
			}
		}

		// ===================================================
		// DURACION REAL
		// ===================================================
		const duracionSlots =
			horaAMinutos(slots[slots.length - 1].hora_fin) -
			horaAMinutos(slots[0].hora_inicio);

		if (duracionSlots !== Number(servicio.duracion)) {
			throw crearError(
				"Los horarios seleccionados no corresponden a la duración del servicio que es de: " +
					servicio.duracion +
					" min   y el horario es de: " +
					duracionSlots +
					" min",
				400,
				"DURACION_INVALIDA",
			);
		}

		// ===================================================
		// VALIDAR HORAS
		// ===================================================

		if (
			reserva.hora_inicio !== slots[0].hora_inicio ||
			reserva.hora_fin !== slots[slots.length - 1].hora_fin
		) {
			throw crearError(
				"El horario de la reserva no coincide con los slots seleccionados.",
				400,
				"HORARIO_INVALIDO",
			);
		}

		// ===================================================
		// PRECIO REAL Y VALIDACIÓN DEL DESCUENTO
		// ===================================================
		const precioOriginal = Number(servicio.precio);

		const montoPromocion = 0;
		let montoDescuento = 0;
		let descuentoValidado = null;

		const codigoDescuento = String(reserva.codigo_descuento || "").trim();

		if (codigoDescuento) {
			descuentoValidado = await descuentoRepository.obtenerDescuentoParaReserva(
				client,
				codigoDescuento,
				Number(servicio.id),
				clienteId,
			);

			if (!descuentoValidado) {
				throw crearError(
					"El código de descuento no es válido para este servicio, ya fue utilizado o está vencido.",
					409,
					"DESCUENTO_INVALIDO",
				);
			}

			const montoFijo =
				descuentoValidado.monto == null
					? null
					: Number(descuentoValidado.monto);

			const porcentaje =
				descuentoValidado.porcentaje == null
					? null
					: Number(descuentoValidado.porcentaje);

			if (
				(montoFijo !== null && montoFijo < 0) ||
				(porcentaje !== null && (porcentaje < 0 || porcentaje > 100)) ||
				(montoFijo === null && porcentaje === null) ||
				(montoFijo !== null && porcentaje !== null)
			) {
				throw crearError(
					"La configuración del descuento no es válida.",
					400,
					"CONFIGURACION_DESCUENTO_INVALIDA",
				);
			}

			const calculo =
				montoFijo !== null ? montoFijo : (precioOriginal * porcentaje) / 100;

			montoDescuento =
				Math.round(Math.min(precioOriginal, calculo) * 100) / 100;
		}

		const precioAplicable =
			Math.round(
				Math.max(precioOriginal - montoPromocion - montoDescuento, 0) * 100,
			) / 100;

		// ===================================================
		// ADELANTO REAL
		// ===================================================
		let requiereAdelanto = false;
		let montoAdelanto = 0;

		if (condicionReal && condicionReal.requiere_adelanto === true) {
			requiereAdelanto = true;

			if (
				condicionReal.monto_adelanto !== null &&
				condicionReal.monto_adelanto !== undefined
			) {
				montoAdelanto = Number(condicionReal.monto_adelanto);
			} else if (
				condicionReal.porcentaje_adelanto !== null &&
				condicionReal.porcentaje_adelanto !== undefined
			) {
				montoAdelanto =
					(precioAplicable * Number(condicionReal.porcentaje_adelanto)) / 100;
			}
		}

		// ===================================================
		// VALIDAR ADELANTO
		// ===================================================
		if (requiereAdelanto) {
			if (montoAdelanto <= 0) {
				throw crearError(
					"La condición requiere un adelanto válido.",
					400,
					"ADELANTO_INVALIDO",
				);
			}

			if (!comprobante) {
				throw crearError(
					"Debes adjuntar el comprobante del adelanto.",
					400,
					"COMPROBANTE_REQUERIDO",
				);
			}

			if (!profesional.pago_qr) {
				throw crearError(
					"El profesional no tiene configurado su código QR de pago.",
					400,
					"QR_NO_CONFIGURADO",
				);
			}
		}

		// ===================================================
		// ESTADO RESERVA
		// ===================================================

		/*
		 * SIN ADELANTO
		 * ----------------
		 * CONFIRMADA inmediatamente.
		 *
		 * CON ADELANTO
		 * ----------------
		 * PENDIENTE porque el comprobante
		 * todavía debe ser validado.
		 */

		const estadoReserva = requiereAdelanto ? "PENDIENTE" : "CONFIRMADA";

		// ===================================================
		// MONTO PAGADO / SALDO
		// ===================================================

		const montoPagado = requiereAdelanto ? montoAdelanto : 0;

		const saldo = Math.max(precioAplicable - montoPagado, 0);

		// ===================================================
		// NUMERO DE RESERVA
		// ===================================================

		const numero = await repository.generarNumeroReserva(client);

		// ===================================================
		// CREAR RESERVA
		// ===================================================

		const reservaCreada = await repository.createReserva(client, {
			cliente_id: clienteId,

			servicio_id: servicio.id,

			numero,

			fecha: reserva.fecha,

			hora_inicio: slots[0].hora_inicio,

			hora_fin: slots[slots.length - 1].hora_fin,

			precio_original: precioOriginal,

			monto_promocion: montoPromocion,

			monto_descuento: montoDescuento,

			precio_aplicable: precioAplicable,

			monto_pagado: montoPagado,

			saldo,

			estado: estadoReserva,
		});

		// ===================================================
		// RELACIONAR RESERVA CON SUS SLOTS
		// ===================================================

		for (let i = 0; i < slots.length; i++) {
			await repository.createReservaSlot(
				client,
				reservaCreada.id,
				slots[i].slot_id,
				i + 1,
			);
		}

		// ===================================================
		// MARCAR DESCUENTO COMO UTILIZADO
		// ===================================================
		if (descuentoValidado) {
			await descuentoRepository.marcarDescuentoUtilizado(
				client,
				descuentoValidado.asignacion_id,
				descuentoValidado.codigo,
				montoDescuento,
			);
		}

		// ===================================================
		// HISTORIAL DE LA RESERVA
		// ===================================================
		const historialCreado = await repository.createHistorialReserva(client, {
			reserva_id: reservaCreada.id,
		});

		// ============================================================
		// CREAR NOTIFICACIÓN DE LA RESERVA
		// ============================================================
		// await notificacionRepository.crearNotificacion(client, {
		//   cliente_id: clienteId,
		//   reserva_id: reservaCreada.id,
		//   titulo: requiereAdelanto ? "Reserva pendiente" : "Reserva confirmada",
		//   mensaje: requiereAdelanto
		//     ? `Tu reserva #${reservaCreada.numero} fue registrada y está pendiente de validar el comprobante.`
		//     : `Tu reserva #${reservaCreada.numero} fue confirmada correctamente.`,
		//   tipo: "RESERVA",
		// });

		const notificacionProfesional =
			await notificacionRepository.crearNotificacionProfesional(client, {
				profesional_id: profesional.id,
				reserva_id: reservaCreada.id,
				titulo: "Nueva reserva",
				mensaje: requiereAdelanto
					? `Se registró la reserva #${reservaCreada.numero} y está pendiente de validar el comprobante.`
					: `Se registró la reserva #${reservaCreada.numero} y está confirmada.`,
				tipo: "RESERVA",
			});

		// ===================================================
		// PAGO + COMPROBANTE
		// ===================================================

		let pagoCreado = null;
		let comprobanteCreado = null;
		let archivoCreado = null;

		if (requiereAdelanto) {
			// -----------------------------------------------
			// METODO QR
			// -----------------------------------------------

			const metodoPago = await repository.getMetodoPagoQR(client);

			if (!metodoPago) {
				throw crearError(
					"No existe un método de pago QR activo.",
					500,
					"METODO_QR_NO_CONFIGURADO",
				);
			}

			// -----------------------------------------------
			// ARCHIVO
			// -----------------------------------------------

			archivoCreado = await repository.createArchivo(client, comprobante);

			// -----------------------------------------------
			// PAGO
			// -----------------------------------------------

			pagoCreado = await repository.createPago(client, {
				metodo_pago_id: metodoPago.id,

				cliente_id: clienteId,

				reserva_id: reservaCreada.id,

				profesional_id: profesional.id,

				monto: montoAdelanto,
			});

			// -----------------------------------------------
			// COMPROBANTE
			// -----------------------------------------------

			comprobanteCreado = await repository.createComprobante(
				client,
				pagoCreado.id,
				archivoCreado.id,
			);
		}

		// ===================================================
		// RESERVA COMPLETA
		// ===================================================

		const reservaFinal = await repository.getReservaCompleta(
			client,
			reservaCreada.id,
		);

		// ===================================================
		// COMMIT
		// ===================================================

		await client.query("COMMIT");

		emitirNotificacionProfesional(profesional.id, notificacionProfesional);

		return {
			reserva: reservaFinal,

			condicion: condicionReal,

			pago: {
				requiere_adelanto: requiereAdelanto,

				monto_adelanto: montoAdelanto,

				monto_pagado: montoPagado,

				saldo,

				precio_original: precioOriginal,

				monto_promocion: montoPromocion,

				monto_descuento: montoDescuento,

				precio_aplicable: precioAplicable,
			},

			pago_registro: pagoCreado,

			comprobante: comprobanteCreado,

			archivo: archivoCreado,

			estado: estadoReserva,
		};
	} catch (error) {
		await client.query("ROLLBACK");

		throw error;
	} finally {
		client.release();
	}
}

// =====================================================
// OBTENER RESERVAS DEL CLIENTE
// =====================================================

async function getReservations({ token }) {
	const client = await pool.connect();

	try {
		if (!token) {
			throw crearError(
				"El cliente no está autenticado.",
				401,
				"CLIENTE_NO_AUTENTICADO",
			);
		}

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			throw crearError(
				"El token del cliente no es válido.",
				401,
				"TOKEN_INVALIDO",
			);
		}

		const reservas = await repository.getReservationsByCliente(
			client,
			Number(cliente.id),
		);

		return reservas;
	} finally {
		client.release();
	}
}

async function getUpcomingReservations({ token }) {
	const reservas = await getReservations({ token });

	const ahora = new Date();

	return reservas.filter((reserva) => {
		const estado = String(reserva.estado || "").toUpperCase();

		if (!["PENDIENTE", "CONFIRMADA"].includes(estado)) {
			return false;
		}

		const fechaHora = new Date(
			`${String(reserva.fecha).slice(0, 10)}T${reserva.hora_inicio}`,
		);

		return fechaHora >= ahora;
	});
}

async function getReservationHistory({ token }) {
	const reservas = await getReservations({ token });

	const ahora = new Date();

	return reservas.filter((reserva) => {
		const estado = String(reserva.estado || "").toUpperCase();

		if (["COMPLETADA", "CANCELADA", "NO_ASISTIO"].includes(estado)) {
			return true;
		}

		if (["PENDIENTE", "CONFIRMADA"].includes(estado)) {
			const fechaHora = new Date(
				`${String(reserva.fecha).slice(0, 10)}T${reserva.hora_inicio}`,
			);

			return fechaHora < ahora;
		}

		return false;
	});
}

// =====================================================
// OBTENER DETALLE DE UNA RESERVA
// =====================================================

async function getReservationById({ token, reservaId }) {
	const client = await pool.connect();

	try {
		if (!token) {
			throw crearError(
				"El cliente no está autenticado.",
				401,
				"CLIENTE_NO_AUTENTICADO",
			);
		}

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			throw crearError(
				"El token del cliente no es válido.",
				401,
				"TOKEN_INVALIDO",
			);
		}

		const reserva = await repository.getReservaCompletaCliente(
			client,
			reservaId,
			Number(cliente.id),
		);

		if (!reserva) {
			throw crearError(
				"La reserva no existe o no pertenece al cliente.",
				404,
				"RESERVA_NO_ENCONTRADA",
			);
		}

		return reserva;
	} finally {
		client.release();
	}
}

module.exports = {
	confirmReservation,
	getReservations,
	getReservationById,

	getUpcomingReservations,
	getReservationHistory,
};
