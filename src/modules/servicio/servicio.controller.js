const service = require("./servicio.service");

// ============================================================
// CREAR SERVICIO
// ============================================================

const saveService = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;
      throw error;
    }

    let servicio = null;
    let condicion = null;

    try {
      servicio = req.body.servicio ? JSON.parse(req.body.servicio) : null;

      condicion = req.body.condicion ? JSON.parse(req.body.condicion) : null;
    } catch (error) {
      const err = new Error(
        "Los datos del servicio no tienen un formato válido",
      );

      err.status = 400;
      throw err;
    }

    const fotos = req.files?.fotos || [];
    const videos = req.files?.videos || [];

    const resultado = await service.saveService({
      profesionalId,
      servicio,
      condicion,
      fotos,
      videos,
    });

    res.status(201).json({
      ok: true,
      message: "Servicio creado correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LISTAR SERVICIOS
// ============================================================

const getServices = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;
      throw error;
    }

    const servicios = await service.getServices(profesionalId);

    res.status(200).json({
      ok: true,
      data: servicios,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// OBTENER DETALLE
// ============================================================

const getServiceById = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const servicioId = req.params.id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;
      throw error;
    }

    const resultado = await service.getServiceById(profesionalId, servicioId);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EDITAR SERVICIO
// ============================================================

const updateService = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const servicioId = req.params.id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;
      throw error;
    }

    const resultado = await service.updateService(
      profesionalId,
      servicioId,
      req.body,
    );

    res.status(200).json({
      ok: true,
      message: "Servicio actualizado correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// HABILITAR / DESHABILITAR
// ============================================================

const updateServiceStatus = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const servicioId = req.params.id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;
      throw error;
    }

    const resultado = await service.updateServiceStatus(
      profesionalId,
      servicioId,
      req.body,
    );

    res.status(200).json({
      ok: true,
      message: "Estado del servicio actualizado correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  saveService,
  updateService,
  updateServiceStatus,
};
