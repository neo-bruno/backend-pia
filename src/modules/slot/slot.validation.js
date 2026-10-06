// =====================================================
// VALIDAR PROFESIONAL ACTUAL
// =====================================================

const validarProfesional = (req, res, next) => {
  const profesionalId = Number(req.usuario?.profesional_id);

  if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
    return res.status(401).json({
      ok: false,
      message: "El usuario no tiene un profesional asociado",
    });
  }

  req.profesionalId = profesionalId;

  next();
};

// =====================================================
// VALIDAR SLOTS
// =====================================================

const validarSlots = (req, res, next) => {
  const slots = req.body;

  // =====================================================
  // DEBE SER UN ARREGLO
  // =====================================================

  if (!Array.isArray(slots)) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo de la solicitud debe ser un arreglo",
    });
  }

  const slotsValidos = [];

  // =====================================================
  // RECORRER SLOTS
  // =====================================================

  for (const slot of slots) {
    const slotId =
      slot?.slot_id === null ||
      slot?.slot_id === undefined ||
      slot?.slot_id === ""
        ? null
        : Number(slot.slot_id);

    const horarioProfesionalId = Number(slot?.horario_profesional_id);

    const horaInicio = String(slot?.hora_inicio || "").trim();

    const horaFin = String(slot?.hora_fin || "").trim();

    const estado = String(slot?.estado || "")
      .trim()
      .toUpperCase();

    // =====================================================
    // SLOT ID
    // =====================================================

    if (slotId !== null && (!Number.isInteger(slotId) || slotId <= 0)) {
      return res.status(400).json({
        ok: false,
        message: "slot_id inválido",
      });
    }

    // =====================================================
    // HORARIO PROFESIONAL
    // =====================================================

    if (!Number.isInteger(horarioProfesionalId) || horarioProfesionalId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "horario_profesional_id inválido",
      });
    }

    // =====================================================
    // HORAS
    // =====================================================

    const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!formatoHora.test(horaInicio)) {
      return res.status(400).json({
        ok: false,
        message: `hora_inicio inválida: ${horaInicio}`,
      });
    }

    if (!formatoHora.test(horaFin)) {
      return res.status(400).json({
        ok: false,
        message: `hora_fin inválida: ${horaFin}`,
      });
    }

    // =====================================================
    // ESTADO
    // =====================================================

    const estadosPermitidos = ["DISPONIBLE", "BLOQUEADO", "OCUPADO"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado de slot inválido: ${estado}`,
      });
    }

    // =====================================================
    // NORMALIZAMOS
    // =====================================================

    slotsValidos.push({
      slot_id: slotId,

      horario_profesional_id: horarioProfesionalId,

      hora_inicio: horaInicio,

      hora_fin: horaFin,

      estado,
    });
  }

  // =====================================================
  // ELIMINAR DUPLICADOS
  // =====================================================

  const unicos = [];

  const existentes = new Set();

  for (const slot of slotsValidos) {
    const clave = `${slot.horario_profesional_id}-${slot.hora_inicio}-${slot.hora_fin}`;

    if (!existentes.has(clave)) {
      existentes.add(clave);

      unicos.push(slot);
    }
  }

  // =====================================================
  // ENTREGAR AL CONTROLLER
  // =====================================================

  req.slots = unicos;

  next();
};

module.exports = {
  validarProfesional,
  validarSlots,
};
