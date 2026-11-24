const pool = require("../../database/pool");
const repository = require("./slot.repository");

// =====================================================
// NOMBRES DE LOS DÍAS
// =====================================================

const nombresDias = [
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
	"Domingo",
];

const obtenerMensajeErrorSlot = (error) => {
	if (
		error.code === "23505" &&
		error.constraint === "uq_slot_horario_profesional_hora"
	) {
		return {
			status: 409,
			mensaje:
				"No se pudieron guardar los horarios porque existe una hora duplicada. Revisa los horarios y elimina las horas repetidas antes de continuar.",
		};
	}

	if (error.status === 409) {
		return {
			status: 409,
			mensaje: error.message,
		};
	}

	return {
		status: 500,
		mensaje: "No se pudieron guardar los horarios. Inténtalo nuevamente.",
	};
};

// =====================================================
// OBTENER SLOTS
// =====================================================

const getSlots = async (profesionalId) => {
	const client = await pool.connect();

	try {
		const rows = await repository.getSlotsByProfesionalId(
			client,
			profesionalId,
		);

		// =================================================
		// PROFESIONAL
		// =================================================

		const profesional =
			rows.length > 0
				? {
						id: Number(rows[0].profesional_id),
						nombre: rows[0].profesional_nombre,
					}
				: {
						id: Number(profesionalId),
						nombre: null,
					};

		// =================================================
		// AGRUPAR HORARIOS
		// =================================================

		const horariosMap = new Map();

		for (const row of rows) {
			const horarioProfesionalId = Number(row.horario_profesional_id);

			if (!horariosMap.has(horarioProfesionalId)) {
				horariosMap.set(horarioProfesionalId, {
					horario_profesional_id: horarioProfesionalId,

					horario_id: Number(row.horario_id),

					dia_semana: Number(row.dia_semana),

					turno: Number(row.turno),

					hora_inicio: row.horario_inicio,

					hora_fin: row.horario_fin,

					duracion: row.duracion ? Number(row.duracion) : 60,

					slots: [],
				});
			}

			// ===============================================
			// SLOT
			// ===============================================

			if (row.slot_id !== null) {
				horariosMap.get(horarioProfesionalId).slots.push({
					id: Number(row.slot_id),

					hora_inicio: row.slot_inicio,

					hora_fin: row.slot_fin,

					duracion: Number(row.duracion),

					estado: row.slot_estado,
				});
			}
		}

		// =================================================
		// CONSTRUIR LOS 7 DÍAS
		// =================================================

		const dias = nombresDias.map((nombre, index) => {
			const diaSemana = index + 1;

			const horarios = Array.from(horariosMap.values())

				.filter((horario) => horario.dia_semana === diaSemana)

				.map((horario) => ({
					horario_profesional_id: horario.horario_profesional_id,

					horario_id: horario.horario_id,

					hora_inicio: horario.hora_inicio,

					hora_fin: horario.hora_fin,

					duracion: horario.duracion,

					slots: horario.slots,
				}));

			return {
				id: diaSemana,

				nombre,

				expandido: index === 0,

				horarios,
			};
		});

		// =================================================
		// RESPUESTA
		// =================================================

		return {
			profesional,

			dias,
		};
	} finally {
		client.release();
	}
};

// =====================================================
// GUARDAR / SINCRONIZAR SLOTS
// =====================================================
const saveSlots = async (profesionalId, slots) => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		if (!Array.isArray(slots)) {
			const error = new Error(
				"La información de horarios no tiene un formato válido.",
			);
			error.status = 400;
			throw error;
		}

		// =====================================================
		// 1. HORARIOS PROFESIONALES DEL PROFESIONAL
		// =====================================================

		const horariosProfesionales = await repository.getHorariosProfesionales(
			client,
			profesionalId,
		);

		const horariosMap = new Map();

		horariosProfesionales.forEach((horario) => {
			horariosMap.set(Number(horario.horario_profesional_id), horario);
		});

		// =====================================================
		// 2. NORMALIZAR Y VALIDAR DATOS RECIBIDOS
		// =====================================================

		const slotsNormalizados = slots.map((slot) => {
			const slotId =
				slot.slot_id === null ||
				slot.slot_id === undefined ||
				slot.slot_id === ""
					? null
					: Number(slot.slot_id);

			const horaInicio = String(slot.hora_inicio || "").substring(0, 5);
			const horaFin = String(slot.hora_fin || "").substring(0, 5);
			const horarioProfesionalId = Number(slot.horario_profesional_id);
			const estado = String(slot.estado || "DISPONIBLE")
				.trim()
				.toUpperCase();

			if (
				!Number.isInteger(horarioProfesionalId) ||
				!horariosMap.has(horarioProfesionalId)
			) {
				const error = new Error(
					`El horario profesional ${slot.horario_profesional_id} no pertenece al profesional autenticado.`,
				);
				error.status = 400;
				throw error;
			}

			if (slotId !== null && (!Number.isInteger(slotId) || slotId <= 0)) {
				const error = new Error(
					"Se recibió un identificador de slot inválido.",
				);
				error.status = 400;
				throw error;
			}

			if (!/^\d{2}:\d{2}$/.test(horaInicio) || !/^\d{2}:\d{2}$/.test(horaFin)) {
				const error = new Error(
					"Uno de los horarios tiene un formato de hora inválido.",
				);
				error.status = 400;
				throw error;
			}

			return {
				slot_id: slotId,
				horario_profesional_id: horarioProfesionalId,
				hora_inicio: horaInicio,
				hora_fin: horaFin,
				duracion: horaAMinutos(horaFin) - horaAMinutos(horaInicio),
				estado,
			};
		});

		// =====================================================
		// 3. VALIDAR ESTADOS, RANGOS Y SOLAPAMIENTOS
		// =====================================================

		const estadosPermitidos = new Set(["DISPONIBLE", "BLOQUEADO", "OCUPADO"]);

		const slotsPorHorario = new Map();

		for (const slot of slotsNormalizados) {
			if (!estadosPermitidos.has(slot.estado)) {
				const error = new Error(`Estado de slot inválido: ${slot.estado}`);
				error.status = 400;
				throw error;
			}

			const horario = horariosMap.get(slot.horario_profesional_id);
			const inicio = horaAMinutos(slot.hora_inicio);
			const fin = horaAMinutos(slot.hora_fin);
			const horarioInicio = horaAMinutos(horario.hora_inicio);
			const horarioFin = horaAMinutos(horario.hora_fin);

			if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) {
				const error = new Error(
					`La hora ${slot.hora_inicio}-${slot.hora_fin} no es válida.`,
				);
				error.status = 400;
				throw error;
			}

			if (inicio < horarioInicio || fin > horarioFin) {
				const error = new Error(
					`El slot ${slot.hora_inicio}-${slot.hora_fin} está fuera del horario profesional.`,
				);
				error.status = 400;
				throw error;
			}

			slot.duracion = fin - inicio;

			if (!slotsPorHorario.has(slot.horario_profesional_id)) {
				slotsPorHorario.set(slot.horario_profesional_id, []);
			}

			slotsPorHorario.get(slot.horario_profesional_id).push(slot);
		}

		// No permitir intervalos duplicados ni superpuestos en la solicitud.
		for (const [horarioProfesionalId, lista] of slotsPorHorario.entries()) {
			lista.sort(
				(a, b) => horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio),
			);

			for (let i = 1; i < lista.length; i++) {
				const anterior = lista[i - 1];
				const actual = lista[i];

				if (
					horaAMinutos(actual.hora_inicio) < horaAMinutos(anterior.hora_fin)
				) {
					const error = new Error(
						`Hay horarios duplicados o superpuestos en el horario profesional ${horarioProfesionalId}: ${anterior.hora_inicio}-${anterior.hora_fin} y ${actual.hora_inicio}-${actual.hora_fin}.`,
					);
					error.status = 409;
					throw error;
				}
			}
		}

		// =====================================================
		// 4. OBTENER SLOTS ACTUALES Y PREPARAR ÍNDICES
		// =====================================================

		const actuales = await repository.getSlotsActuales(client, profesionalId);

		const actualesMap = new Map();
		const actualesPorClave = new Map();

		actuales.forEach((slotActual) => {
			const id = Number(slotActual.slot_id);
			const hpId = Number(slotActual.horario_profesional_id);
			const inicio = String(slotActual.hora_inicio).substring(0, 5);
			const fin = String(slotActual.hora_fin).substring(0, 5);
			const clave = `${hpId}|${inicio}|${fin}`;

			actualesMap.set(id, slotActual);
			actualesPorClave.set(clave, slotActual);
		});

		const idsRecibidos = slotsNormalizados
			.filter((slot) => slot.slot_id !== null)
			.map((slot) => slot.slot_id);

		if (new Set(idsRecibidos).size !== idsRecibidos.length) {
			const error = new Error(
				"La solicitud contiene identificadores de slots repetidos.",
			);
			error.status = 400;
			throw error;
		}

		// =====================================================
		// 5. RECONCILIAR LOS SLOTS EXISTENTES
		// =====================================================
		//
		// Si el frontend envía slot_id=null para un intervalo que
		// ya existe, reutilizamos el registro existente por su clave
		// natural. Así evitamos intentar insertar el mismo intervalo.
		// =====================================================

		const slotsAConservar = new Set();
		const operaciones = [];

		for (const slot of slotsNormalizados) {
			const clave = `${slot.horario_profesional_id}|${slot.hora_inicio}|${slot.hora_fin}`;

			let slotActual = null;

			if (slot.slot_id !== null) {
				slotActual = actualesMap.get(slot.slot_id);

				if (!slotActual) {
					const error = new Error(
						`El slot ${slot.slot_id} no existe o no pertenece al profesional.`,
					);
					error.status = 400;
					throw error;
				}

				if (
					Number(slotActual.horario_profesional_id) !==
					slot.horario_profesional_id
				) {
					const error = new Error(
						`El slot ${slot.slot_id} no puede cambiar de horario profesional.`,
					);
					error.status = 400;
					throw error;
				}

				const inicioActual = String(slotActual.hora_inicio).substring(0, 5);
				const finActual = String(slotActual.hora_fin).substring(0, 5);

				// Un ID existente debe conservar su intervalo. Cuando cambia
				// la duración, el frontend debe enviar un slot nuevo (sin ID).
				if (inicioActual !== slot.hora_inicio || finActual !== slot.hora_fin) {
					const error = new Error(
						`El slot ${slot.slot_id} cambió de intervalo. Debe sincronizarse como un nuevo slot.`,
					);
					error.status = 409;
					throw error;
				}
			} else {
				slotActual = actualesPorClave.get(clave) || null;
			}

			if (slotActual) {
				const idActual = Number(slotActual.slot_id);
				slotsAConservar.add(idActual);

				// Si la interfaz envió un slot sin ID pero el intervalo ya
				// existía, conservamos su estado actual para no desbloquearlo
				// accidentalmente ni perder una reserva.
				if (slot.slot_id === null) {
					slot.estado = slotActual.slot_estado;
				}

				if (slotActual.slot_estado === "OCUPADO") {
					if (slot.estado !== "OCUPADO") {
						const error = new Error(
							`El horario ${slot.hora_inicio}-${slot.hora_fin} está ocupado y no puede modificarse.`,
						);
						error.status = 409;
						throw error;
					}

					operaciones.push({
						tipo: "conservar",
						slot,
						slotActual,
					});
					continue;
				}

				// Si el slot tiene una relación con una reserva, no permitimos
				// cambiar su estado ni su configuración por esta sincronización.
				const tieneReserva = await repository.tieneRelacionReserva(
					client,
					idActual,
				);

				if (tieneReserva && slot.estado !== slotActual.slot_estado) {
					const error = new Error(
						`El horario ${slot.hora_inicio}-${slot.hora_fin} tiene reservas vinculadas y no puede cambiar su estado.`,
					);
					error.status = 409;
					throw error;
				}

				operaciones.push({
					tipo: "modificar",
					slot,
					slotActual,
				});
			} else {
				if (slot.estado === "OCUPADO") {
					const error = new Error(
						"No se puede crear un slot nuevo con estado OCUPADO.",
					);
					error.status = 400;
					throw error;
				}

				operaciones.push({
					tipo: "crear",
					slot,
				});
			}
		}

		// =====================================================
		// 6. IDENTIFICAR Y VALIDAR SLOTS QUE DESAPARECEN
		// =====================================================

		const slotsAEliminar = [];

		for (const slotActual of actuales) {
			const slotId = Number(slotActual.slot_id);

			if (slotsAConservar.has(slotId)) {
				continue;
			}

			const tieneReserva = await repository.tieneRelacionReserva(
				client,
				slotId,
			);

			if (tieneReserva) {
				const error = new Error(
					`No se puede cambiar la distribución porque el horario ${slotActual.hora_inicio}-${slotActual.hora_fin} tiene reservas vinculadas. Resuelve esas reservas antes de modificar la duración.`,
				);
				error.status = 409;
				throw error;
			}

			if (slotActual.slot_estado === "OCUPADO") {
				const error = new Error(
					`No se puede eliminar el horario ${slotActual.hora_inicio}-${slotActual.hora_fin} porque está ocupado.`,
				);
				error.status = 409;
				throw error;
			}

			slotsAEliminar.push(slotActual);
		}

		// =====================================================
		// 7. ELIMINAR PRIMERO LOS SLOTS OBSOLETOS
		// =====================================================
		//
		// Esta es la corrección principal: se eliminan los intervalos
		// antiguos seguros ANTES de insertar los nuevos. Todo sigue
		// dentro de la misma transacción; ante cualquier error se revierte.
		// =====================================================

		let eliminados = 0;

		for (const slotActual of slotsAEliminar) {
			await repository.eliminarSlot(client, Number(slotActual.slot_id));
			eliminados++;
		}

		// =====================================================
		// 8. MODIFICAR / CREAR LOS INTERVALOS DESEADOS
		// =====================================================

		let creados = 0;
		let modificados = 0;

		for (const operacion of operaciones) {
			if (operacion.tipo === "conservar") {
				continue;
			}

			if (operacion.tipo === "modificar") {
				await repository.modificarSlot(
					client,
					Number(operacion.slotActual.slot_id),
					{
						hora_inicio: operacion.slot.hora_inicio,
						hora_fin: operacion.slot.hora_fin,
						duracion: operacion.slot.duracion,
						estado: operacion.slot.estado,
					},
				);

				modificados++;
				continue;
			}

			await repository.crearSlot(client, {
				horario_profesional_id: operacion.slot.horario_profesional_id,
				hora_inicio: operacion.slot.hora_inicio,
				hora_fin: operacion.slot.hora_fin,
				duracion: operacion.slot.duracion,
				estado: operacion.slot.estado,
			});

			creados++;
		}

		// =====================================================
		// 9. COMMIT
		// =====================================================

		await client.query("COMMIT");

		// =====================================================
		// 10. LEER ESTADO FINAL
		// =====================================================

		const clientLectura = await pool.connect();
		let slotsFinales;

		try {
			slotsFinales = await repository.getSlotsActuales(
				clientLectura,
				profesionalId,
			);
		} finally {
			clientLectura.release();
		}

		return {
			creados,
			modificados,
			eliminados,
			total: slotsFinales.length,
			slots: slotsFinales,
		};
	} catch (error) {
		await client.query("ROLLBACK");

		console.error("========== ERROR SAVE SLOTS ==========");
		console.error("Código:", error.code);
		console.error("Restricción:", error.constraint);
		console.error("Detalle:", error.detail);
		console.error("Mensaje:", error.message);
		console.error("======================================");

		const errorAmigable = obtenerMensajeErrorSlot(error);

		error.status = errorAmigable.status;
		error.message = errorAmigable.mensaje;

		throw error;
	} finally {
		client.release();
	}
};

// =====================================================
// HORA → MINUTOS
// =====================================================

const horaAMinutos = (hora) => {
	const partes = String(hora).substring(0, 5).split(":").map(Number);

	return partes[0] * 60 + partes[1];
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
	saveSlots,
	getSlots,
};
