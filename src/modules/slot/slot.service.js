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

          duracion: row.slot_duracion ? Number(row.slot_duracion) : 60,

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
  console.log("========================================");
console.log("SERVICE SAVE SLOTS");
console.log("PID:", process.pid);
console.log("FILE:", __filename);
console.log("SLOTS RECIBIDOS:");
console.log(JSON.stringify(slots, null, 2));
console.log("========================================");
  try {
    
    await client.query("BEGIN");

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
    // 2. VALIDAR HORARIOS PROFESIONALES
    // =====================================================

    for (const slot of slots) {
      const hpId = Number(slot.horario_profesional_id);

      if (!horariosMap.has(hpId)) {
        const error = new Error(
          `El horario profesional ${hpId} no pertenece al profesional autenticado`,
        );

        error.status = 400;

        throw error;
      }
    }

    // =====================================================
    // 3. NORMALIZAR DATOS
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

      const estado = String(slot.estado || "DISPONIBLE")
        .trim()
        .toUpperCase();

      const duracion = horaAMinutos(horaFin) - horaAMinutos(horaInicio);

      return {
        slot_id: slotId,

        horario_profesional_id: Number(slot.horario_profesional_id),

        hora_inicio: horaInicio,

        hora_fin: horaFin,

        duracion,

        estado,
      };
    });

        console.log("====================================");
    console.log("SLOTS NORMALIZADOS");
    console.log(
      JSON.stringify(
        slotsNormalizados.filter(
          (slot) => [56, 57, 58].includes(Number(slot.slot_id))
        ),
        null,
        2
      )
    );
    console.log("====================================");

    // =====================================================
    // 4. VALIDAR ESTADOS
    // =====================================================

    const estadosPermitidos = new Set(["DISPONIBLE", "BLOQUEADO", "OCUPADO"]);

    for (const slot of slotsNormalizados) {
      if (!estadosPermitidos.has(slot.estado)) {
        const error = new Error(`Estado de slot inválido: ${slot.estado}`);

        error.status = 400;

        error.detalle = {
          slot_id: slot.slot_id,
          estado: slot.estado,
        };

        throw error;
      }
    }

    // =====================================================
    // 5. VALIDAR HORAS
    // =====================================================

    for (const slot of slotsNormalizados) {
      const horario = horariosMap.get(Number(slot.horario_profesional_id));

      const inicio = horaAMinutos(slot.hora_inicio);

      const fin = horaAMinutos(slot.hora_fin);

      const horarioInicio = horaAMinutos(horario.hora_inicio);

      const horarioFin = horaAMinutos(horario.hora_fin);

      if (fin <= inicio) {
        const error = new Error(
          `La hora ${slot.hora_inicio}-${slot.hora_fin} no es válida`,
        );

        error.status = 400;

        throw error;
      }

      if (inicio < horarioInicio || fin > horarioFin) {
        const error = new Error(
          `El slot ${slot.hora_inicio}-${slot.hora_fin} está fuera del horario profesional`,
        );

        error.status = 400;

        throw error;
      }

      slot.duracion = fin - inicio;
    }

    // =====================================================
    // 6. OBTENER SLOTS ACTUALES
    // =====================================================

    const actuales = await repository.getSlotsActuales(client, profesionalId);

    console.log("====================================");
console.log("SLOTS ACTUALES BD");
console.log(
  JSON.stringify(
    actuales.filter(
      (slot) => [56, 57, 58].includes(Number(slot.slot_id))
    ),
    null,
    2
  )
);
console.log("====================================");

    const actualesMap = new Map();

    actuales.forEach((slot) => {
      actualesMap.set(Number(slot.slot_id), slot);
    });

    // =====================================================
    // 7. VALIDAR IDS REPETIDOS
    // =====================================================

    const idsRecibidos = slotsNormalizados
      .filter((slot) => slot.slot_id !== null)
      .map((slot) => Number(slot.slot_id));

    const idsUnicos = new Set(idsRecibidos);

    if (idsRecibidos.length !== idsUnicos.size) {
      const error = new Error("La solicitud contiene slots repetidos");

      error.status = 400;

      throw error;
    }

    // =====================================================
    // 8. PREPARAR SINCRONIZACIÓN
    // =====================================================

    const idsDeseados = new Set(idsRecibidos);

    let creados = 0;
    let modificados = 0;
    let eliminados = 0;

    // =====================================================
    // 9. CREAR / MODIFICAR
    // =====================================================

    for (const slot of slotsNormalizados) {
      // ---------------------------------------------------
      // NUEVO
      // ---------------------------------------------------

      if (slot.slot_id === null) {
        if (slot.estado === "OCUPADO") {
          const error = new Error(
            "Un slot nuevo no puede crearse como OCUPADO",
          );

          error.status = 400;

          throw error;
        }

        const creado = await repository.crearSlot(client, {
          horario_profesional_id: slot.horario_profesional_id,

          hora_inicio: slot.hora_inicio,

          hora_fin: slot.hora_fin,

          duracion: slot.duracion,

          estado: slot.estado,
        });

        console.log("SLOT CREADO:", creado);

        creados++;

        continue;
      }

      // ---------------------------------------------------
      // EXISTENTE
      // ---------------------------------------------------

      const slotActual = actualesMap.get(Number(slot.slot_id));

      if (!slotActual) {
        const error = new Error(
          `El slot ${slot.slot_id} no existe o no pertenece al profesional`,
        );

        error.status = 400;

        throw error;
      }

      // ---------------------------------------------------
      // VERIFICAR HP
      // ---------------------------------------------------

      if (
        Number(slotActual.horario_profesional_id) !==
        Number(slot.horario_profesional_id)
      ) {
        const error = new Error(
          `El slot ${slot.slot_id} no puede cambiar de horario profesional`,
        );

        error.status = 400;

        throw error;
      }

      // ---------------------------------------------------
      // OCUPADO
      // ---------------------------------------------------

      if (slotActual.estado === "OCUPADO") {
        if (slot.estado !== "OCUPADO") {
          const error = new Error(
            `El slot ${slot.slot_id} está ocupado y no puede cambiarse`,
          );

          error.status = 409;

          throw error;
        }

        continue;
      }

      // ---------------------------------------------------
      // MODIFICAR
      // ---------------------------------------------------
     

      const modificado = await repository.modificarSlot(
        client,

        slot.slot_id,

        {
          hora_inicio: slot.hora_inicio,

          hora_fin: slot.hora_fin,

          duracion: slot.duracion,

          estado: slot.estado,
        },
      );      
      modificados++;
    }

    // =====================================================
    // 10. ELIMINAR LOS QUE YA NO VIENEN
    // =====================================================

    for (const slotActual of actuales) {
      const slotId = Number(slotActual.slot_id);

      // ---------------------------------------------------
      // SIGUE EXISTIENDO
      // ---------------------------------------------------

      if (idsDeseados.has(slotId)) {
        continue;
      }

      // ---------------------------------------------------
      // OCUPADO
      // ---------------------------------------------------

      if (slotActual.estado === "OCUPADO") {
        const error = new Error(
          `No se puede eliminar el slot ${slotId} porque está ocupado`,
        );

        error.status = 409;

        throw error;
      }

      // ---------------------------------------------------
      // RESERVA CONFIRMADA
      // ---------------------------------------------------

      const tieneReserva = await repository.tieneReservaConfirmada(
        client,
        slotId,
      );

      if (tieneReserva) {
        const error = new Error(
          `No se puede eliminar el slot ${slotId} porque tiene una reserva confirmada`,
        );

        error.status = 409;

        throw error;
      }

      await repository.eliminarSlot(client, slotId);

      eliminados++;
    }

    // =====================================================
    // 11. COMMIT
    // =====================================================

    console.log("====================================");

    console.log("ANTES DE COMMIT");

    console.log({
      creados,
      modificados,
      eliminados,
    });

    await client.query("COMMIT");

    console.log("COMMIT REALIZADO CORRECTAMENTE");

    console.log("====================================");

    // =====================================================
    // 12. LEER ESTADO FINAL
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

    // =====================================================
    // 13. RESPUESTA
    // =====================================================

    return {
      creados,

      modificados,

      eliminados,

      total: slotsFinales.length,

      slots: slotsFinales,
    };
  } catch (error) {
    console.error("====================================");

    console.error("ERROR SAVE SLOTS");

    console.error(error);

    console.error("====================================");

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ERROR ROLLBACK:", rollbackError);
    }

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
