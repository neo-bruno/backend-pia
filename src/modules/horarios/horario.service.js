const pool = require("../../database/pool");

const repository = require("./horario.repository");

const {
  validarProfesionalId,
  validarHorarios,
} = require("./horario.validation");

const saveBusinessHours = async (profesionalId, dias) => {
  profesionalId = validarProfesionalId(profesionalId);

  validarHorarios(dias);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --------------------------------------------
    // 1. OBTENER NEGOCIO
    // --------------------------------------------

    const negocios = await repository.getNegociosByProfesionalId(
      client,
      profesionalId,
    );

    if (negocios.length === 0) {
      const error = new Error("El profesional no tiene un negocio habilitado");

      error.status = 404;

      throw error;
    }

    if (negocios.length > 1) {
      const error = new Error(
        "El profesional tiene más de un negocio habilitado",
      );

      error.status = 409;

      throw error;
    }

    const negocioId = negocios[0].negocio_id;

    // --------------------------------------------
    // 2. HORARIOS ACTUALES
    // --------------------------------------------

    const horariosActuales = await repository.getHorariosByNegocioId(
      client,
      negocioId,
    );

    const horariosMap = new Map();

    horariosActuales.forEach((horario) => {
      const key = `${horario.dia_semana}-${horario.turno}`;

      horariosMap.set(key, horario);
    });

    const horariosProcesados = [];

    // --------------------------------------------
    // 3. CREAR / ACTUALIZAR
    // --------------------------------------------

    for (const dia of dias) {
      const diaSemana = Number(dia.id);

      if (!dia.abierto) {
        continue;
      }

      for (let index = 0; index < dia.horarios.length; index++) {
        const horarioData = dia.horarios[index];

        const turno = index + 1;

        const key = `${diaSemana}-${turno}`;

        const horarioExistente = horariosMap.get(key);

        let horario;

        if (horarioExistente) {
          horario = await repository.updateHorario(
            client,
            horarioExistente.id,
            horarioData.hora_inicio,
            horarioData.hora_fin,
          );
        } else {
          horario = await repository.createHorario(
            client,
            negocioId,
            diaSemana,
            turno,
            horarioData.hora_inicio,
            horarioData.hora_fin,
          );
        }

        horariosProcesados.push(horario.id);
      }
    }

    // --------------------------------------------
    // 4. ELIMINAR HORARIOS SOBRANTES
    // --------------------------------------------

    for (const horario of horariosActuales) {
      if (horariosProcesados.includes(horario.id)) {
        continue;
      }

      const tieneProfesionales = await repository.horarioTieneProfesionales(
        client,
        horario.id,
      );

      if (tieneProfesionales) {
        const error = new Error(
          `No se puede eliminar el horario del día ${horario.dia_semana}, turno ${horario.turno}, porque tiene profesionales asignados`,
        );

        error.status = 409;

        throw error;
      }

      const tieneSlots = await repository.horarioTieneSlots(client, horario.id);

      if (tieneSlots) {
        const error = new Error(
          `No se puede eliminar el horario del día ${horario.dia_semana}, turno ${horario.turno}, porque tiene slots asociados`,
        );

        error.status = 409;

        throw error;
      }

      await repository.deleteHorario(client, horario.id);
    }

    // --------------------------------------------
    // 5. OBTENER RESULTADO FINAL
    // --------------------------------------------

    const horarios = await repository.getHorariosByNegocioId(client, negocioId);

    await client.query("COMMIT");

    return {
      negocio_id: negocioId,
      horarios,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
  { id: 7, nombre: 'Domingo' }
];

const getBusinessHours = async (profesionalId) => {

  profesionalId = validarProfesionalId(profesionalId);

  const client = await pool.connect();

  try {

    const negocio = await repository.getBusinessByProfessionalId(
      client,
      profesionalId
    );

    if (!negocio) {
      const error = new Error(
        'No se encontró un negocio asociado al profesional'
      );

      error.status = 404;
      throw error;
    }

    const horarios = await repository.getHorariosByNegocioId(
      client,
      negocio.negocio_id
    );

    // Construimos los 7 días
    const dias = DIAS_SEMANA.map(dia => {

      const horariosDelDia = horarios
        .filter(horario => horario.dia_semana === dia.id)
        .map(horario => ({
          id: horario.id,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin
        }));

      return {
        id: dia.id,
        nombre: dia.nombre,
        abierto: horariosDelDia.length > 0,
        horarios: horariosDelDia
      };

    });

    return {
      dias,
      negocio: {
        id: negocio.negocio_id,
        nombre: negocio.negocio_nombre,
        slug: negocio.negocio_slug
      }
    };

  } finally {
    client.release();
  }
};

module.exports = {
  saveBusinessHours,
  getBusinessHours,
};
