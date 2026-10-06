const validarProfesionalId = (profesionalId) => {
  if (!profesionalId) {
    const error = new Error("No se encontró el profesional autenticado");

    error.status = 403;

    throw error;
  }

  const id = Number(profesionalId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El profesional autenticado no es válido");

    error.status = 400;

    throw error;
  }

  return id;
};

const validarHorarios = (dias) => {
  if (!Array.isArray(dias)) {
    const error = new Error("Los horarios deben enviarse como un arreglo");

    error.status = 400;

    throw error;
  }

  if (dias.length !== 7) {
    const error = new Error(
      "Debe enviarse la configuración de los 7 días de la semana",
    );

    error.status = 400;

    throw error;
  }

  const diasIds = new Set();

  dias.forEach((dia) => {
    if (!dia || typeof dia !== "object") {
      const error = new Error("Existe un día con formato inválido");

      error.status = 400;

      throw error;
    }

    const diaSemana = Number(dia.id);

    if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
      const error = new Error("El día de la semana no es válido");

      error.status = 400;

      throw error;
    }

    if (diasIds.has(diaSemana)) {
      const error = new Error(`El día ${diaSemana} está repetido`);

      error.status = 400;

      throw error;
    }

    diasIds.add(diaSemana);

    if (typeof dia.abierto !== "boolean") {
      const error = new Error(`El estado del día ${diaSemana} no es válido`);

      error.status = 400;

      throw error;
    }

    if (!Array.isArray(dia.horarios)) {
      const error = new Error(
        `Los horarios del día ${diaSemana} deben ser un arreglo`,
      );

      error.status = 400;

      throw error;
    }

    // Si está cerrado, no necesitamos horarios
    if (!dia.abierto) {
      return;
    }

    // Un día abierto debe tener al menos un horario
    if (dia.horarios.length === 0) {
      const error = new Error(
        `El día ${diaSemana} está abierto pero no tiene horarios`,
      );

      error.status = 400;

      throw error;
    }

    dia.horarios.forEach((horario, index) => {
      if (!horario || typeof horario !== "object") {
        const error = new Error(
          `El horario ${index + 1} del día ${diaSemana} no es válido`,
        );

        error.status = 400;

        throw error;
      }

      const { hora_inicio, hora_fin } = horario;

      if (!hora_inicio || !hora_fin) {
        const error = new Error(
          `El horario ${index + 1} del día ${diaSemana} debe tener hora de inicio y fin`,
        );

        error.status = 400;

        throw error;
      }

      if (!validarFormatoHora(hora_inicio)) {
        const error = new Error(
          `La hora de inicio ${hora_inicio} no es válida`,
        );

        error.status = 400;

        throw error;
      }

      if (!validarFormatoHora(hora_fin)) {
        const error = new Error(`La hora de fin ${hora_fin} no es válida`);

        error.status = 400;

        throw error;
      }

      if (hora_inicio >= hora_fin) {
        const error = new Error(
          `La hora de inicio debe ser menor que la hora de fin en ${dia.nombre}`,
        );

        error.status = 400;

        throw error;
      }
    });

    validarCrucesHorarios(dia);
  });

  return dias;
};

const validarFormatoHora = (hora) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
};

const validarCrucesHorarios = (dia) => {
  const horarios = [...dia.horarios].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio),
  );

  for (let i = 0; i < horarios.length - 1; i++) {
    const actual = horarios[i];
    const siguiente = horarios[i + 1];

    if (actual.hora_fin > siguiente.hora_inicio) {
      const error = new Error(
        `Los horarios del día ${dia.nombre} se están cruzando`,
      );

      error.status = 400;

      throw error;
    }
  }
};

module.exports = {
  validarProfesionalId,
  validarHorarios,
};
