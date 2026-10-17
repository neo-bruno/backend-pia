const service = require("./clienteAdmin.service");

// =====================================================
// LISTA DE CLIENTES
// =====================================================

exports.getClientes = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error("Profesional no autenticado.");
      error.statusCode = 401;
      return next(error);
    }

    const resultado = await service.getClientes(profesionalId, req.query);

    return res.status(200).json({
      ok: true,
      data: resultado.clientes,
      paginacion: {
        pagina: Number(req.query.pagina ?? 1),
        limite: Number(req.query.limite ?? 20),
        total: resultado.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// HISTORIAL DEL CLIENTE
// =====================================================

exports.getHistorialCliente = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error("Profesional no autenticado.");
      error.statusCode = 401;
      return next(error);
    }

    const data = await service.getHistorialCliente(
      profesionalId,
      req.params.clienteId,
    );

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SEGMENTACIÓN DEL CLIENTE
// =====================================================

exports.getSegmentacionCliente = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error("Profesional no autenticado.");
      error.statusCode = 401;
      return next(error);
    }

    const data = await service.getSegmentacionCliente(
      profesionalId,
      req.params.clienteId,
    );

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PROMOCIONES DEL CLIENTE
// =====================================================

exports.getPromocionesCliente = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error("Profesional no autenticado.");
      error.statusCode = 401;
      return next(error);
    }

    const data = await service.getPromocionesCliente(
      profesionalId,
      req.params.clienteId,
    );

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DESCUENTOS DEL CLIENTE
// =====================================================

exports.getDescuentosCliente = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error("Profesional no autenticado.");
      error.statusCode = 401;
      return next(error);
    }

    const data = await service.getDescuentosCliente(
      profesionalId,
      req.params.clienteId,
    );

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
