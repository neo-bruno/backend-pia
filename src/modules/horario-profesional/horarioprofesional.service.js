const pool = require("../../database/pool");
const repository = require("./horarioprofesional.repository");

const saveProfessionalHours = async (profesionalId, asignaciones) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =====================================================
    // 1. OBTENER EL NEGOCIO DEL USUARIO
    // =====================================================

    const negocio = await repository.getNegocioByProfesionalId(
      client,
      profesionalId,
    );

    if (!negocio) {
      const error = new Error(
        "El profesional no tiene acceso administrativo a un negocio",
      );

      error.status = 403;

      throw error;
    }

    // =====================================================
    // 2. IDS QUE LLEGAN DESDE EL FRONTEND
    // =====================================================

    const horarioIds = [
      ...new Set(asignaciones.map((item) => item.horario_id)),
    ];

    const profesionalIds = [
      ...new Set(asignaciones.map((item) => item.profesional_id)),
    ];

    // =====================================================
    // 3. VALIDAR HORARIOS
    // =====================================================

    const horariosValidos = await repository.validarHorariosDelNegocio(
      client,
      negocio.negocio_id,
      horarioIds,
    );

    const horariosValidosSet = new Set(
      horariosValidos.map((item) => Number(item.id)),
    );

    const horariosInvalidos = horarioIds.filter(
      (id) => !horariosValidosSet.has(Number(id)),
    );

    if (horariosInvalidos.length > 0) {
      const error = new Error("Uno o más horarios no pertenecen al negocio");

      error.status = 400;

      error.detalle = {
        horarios_invalidos: horariosInvalidos,
      };

      throw error;
    }

    // =====================================================
    // 4. VALIDAR PROFESIONALES
    // =====================================================

    const profesionalesValidos =
      await repository.validarProfesionalesDelNegocio(
        client,
        negocio.negocio_id,
        profesionalIds,
      );

    const profesionalesValidosSet = new Set(
      profesionalesValidos.map((item) => Number(item.profesional_id)),
    );

    const profesionalesInvalidos = profesionalIds.filter(
      (id) => !profesionalesValidosSet.has(Number(id)),
    );

    if (profesionalesInvalidos.length > 0) {
      const error = new Error(
        "Uno o más profesionales no pertenecen al negocio o están deshabilitados",
      );

      error.status = 400;

      error.detalle = {
        profesionales_invalidos: profesionalesInvalidos,
      };

      throw error;
    }

    // =====================================================
    // 5. OBTENER ASIGNACIONES ACTUALES
    // =====================================================

    const actuales = await repository.getAsignaciones(
      client,
      negocio.negocio_id,
    );

    // =====================================================
    // 6. CREAR SETS PARA COMPARAR
    // =====================================================

    const actualesSet = new Set();

    actuales.forEach((item) => {
      actualesSet.add(`${item.horario_id}-${item.profesional_id}`);
    });

    const nuevasSet = new Set();

    asignaciones.forEach((item) => {
      nuevasSet.add(`${item.horario_id}-${item.profesional_id}`);
    });

    // =====================================================
    // 7. CREAR NUEVAS ASIGNACIONES
    // =====================================================

    let creadas = 0;

    for (const asignacion of asignaciones) {
      const clave = `${asignacion.horario_id}-${asignacion.profesional_id}`;

      // Ya existe
      if (actualesSet.has(clave)) {
        continue;
      }

      await repository.crearAsignacion(
        client,
        asignacion.horario_id,
        asignacion.profesional_id,
      );

      creadas++;
    }

    // =====================================================
    // 8. DETERMINAR LAS ASIGNACIONES QUE SE QUITARON
    // =====================================================

    const eliminaciones = actuales.filter((actual) => {
      const clave = `${actual.horario_id}-${actual.profesional_id}`;

      return !nuevasSet.has(clave);
    });

    // =====================================================
    // 9. VALIDAR QUE SE PUEDAN ELIMINAR
    // =====================================================

    const protegidas = [];

    for (const asignacion of eliminaciones) {
      const tieneSlots = await repository.tieneSlots(client, asignacion.id);

      if (tieneSlots) {
        protegidas.push({
          id: asignacion.id,
          horario_id: asignacion.horario_id,
          profesional_id: asignacion.profesional_id,
        });
      }
    }

    // =====================================================
    // 10. SI HAY ASIGNACIONES PROTEGIDAS,
    //     CANCELAMOS TODA LA OPERACIÓN
    // =====================================================

    if (protegidas.length > 0) {
      const error = new Error(
        "No se pueden eliminar una o más asignaciones porque ya tienen slots generados",
      );

      error.status = 409;

      error.detalle = {
        asignaciones_protegidas: protegidas,
      };

      throw error;
    }

    // =====================================================
    // 11. ELIMINAR LAS QUE YA NO VIENEN
    // =====================================================

    let eliminadas = 0;

    for (const asignacion of eliminaciones) {
      await repository.eliminarAsignacion(client, asignacion.id);

      eliminadas++;
    }

    // =====================================================
    // 12. OBTENER ESTADO FINAL
    // =====================================================

    const asignacionesFinales = await repository.getAsignaciones(
      client,
      negocio.negocio_id,
    );

    // =====================================================
    // 13. COMMIT
    // =====================================================

    await client.query("COMMIT");

    return {
      negocio: {
        id: negocio.negocio_id,
        nombre: negocio.negocio_nombre,
      },

      creadas,

      eliminadas,

      total: asignacionesFinales.length,

      asignaciones: asignacionesFinales,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

// =====================================================
// OBTENER RELACIÓN HORARIO - PROFESIONAL
// =====================================================

const getProfessionalHours = async (profesionalId) => {
  const client = await pool.connect();

  try {
    const asignaciones = await repository.getProfessionalHours(
      client,
      profesionalId,
    );

    return {
      asignaciones: asignaciones.map((item) => ({
        horario_id: Number(item.horario_id),
        profesional_id: Number(item.profesional_id),
      })),
    };
  } finally {
    client.release();
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getProfessionalHours,
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  saveProfessionalHours,
  getProfessionalHours,
};
