// ============================================================
// PIA - MÓDULO BLOQUEO
// Capa: controller
// ============================================================

const service = require("./bloqueo.service");

// ============================================================
// CREAR BLOQUEO DE HORARIO
// ============================================================

const crearBloqueo = async (req, res, next) => {
  try {
    // El profesional se obtiene del usuario autenticado.
    // Nunca se recibe el profesionalId desde req.body.
    const profesionalId = req.usuario?.profesional_id;

    const datos = {
      negocio_id: req.usuario?.negocio_id,
      fecha: req.body.fecha,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      motivo: req.body.motivo ?? null,
    };

    const bloqueo = await service.crearBloqueo(profesionalId, datos);

    res.status(201).json({
      ok: true,
      message: "Horario bloqueado correctamente",
      data: bloqueo,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// OBTENER BLOQUEOS POR FECHA
// ============================================================

const obtenerBloqueosPorFecha = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const negocioId = req.usuario?.negocio_id;
    const { fecha } = req.query;

    const bloqueos = await service.obtenerBloqueosPorFecha(
      negocioId,
      profesionalId,
      fecha,
    );

    res.status(200).json({
      ok: true,
      data: bloqueos,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CANCELAR BLOQUEO
// ============================================================

const cancelarBloqueo = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const negocioId = req.usuario?.negocio_id;
    const { id } = req.params;

    const bloqueo = await service.cancelarBloqueo(id, negocioId, profesionalId);

    res.status(200).json({
      ok: true,
      message: "Bloqueo cancelado correctamente",
      data: bloqueo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearBloqueo,
  obtenerBloqueosPorFecha,
  cancelarBloqueo,
};
