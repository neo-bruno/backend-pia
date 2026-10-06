const service = require("./servicioarchivo.service");

const createFileVideo = async (req, res, next) => {
  try {
    const servicioId = Number(req.params.servicioId);

    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const videos = req.files || [];

    const archivos = await service.createFileVideo({
      servicioId,
      profesionalId,
      videos,
    });

    res.status(201).json({
      ok: true,
      message: "Videos agregados correctamente",
      data: archivos,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// AGREGAR FOTOS
// ============================================================

const createFile = async (req, res, next) => {
  try {
    const servicioId = Number(req.params.servicioId);

    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const fotos = req.files || [];

    const archivos = await service.createFile({
      servicioId,
      profesionalId,
      fotos,
    });

    res.status(201).json({
      ok: true,
      message: "Fotos agregadas correctamente",
      data: archivos,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LISTAR
// ============================================================

const getFilesByService = async (req, res, next) => {
  try {
    const servicioId = Number(req.params.servicioId);

    const archivos = await service.getFilesByService(servicioId);

    res.status(200).json({
      ok: true,
      data: archivos,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ELIMINAR
// ============================================================

const deleteFile = async (req, res, next) => {
  try {
    const archivoId = Number(req.params.id);

    await service.deleteFile(archivoId);

    res.status(200).json({
      ok: true,
      message: "Archivo eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PRINCIPAL
// ============================================================

const setPrincipal = async (req, res, next) => {
  try {
    const archivoId = Number(req.params.id);

    const archivo = await service.setPrincipal(archivoId);

    res.status(200).json({
      ok: true,
      message: "Imagen principal actualizada correctamente",
      data: archivo,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ORDEN
// ============================================================

const updateOrder = async (req, res, next) => {
  try {
    const archivoId = Number(req.params.id);

    const orden = Number(req.body.orden);

    const archivo = await service.updateOrder(archivoId, orden);

    res.status(200).json({
      ok: true,
      message: "Orden actualizado correctamente",
      data: archivo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFile,
  createFileVideo,
  getFilesByService,
  deleteFile,
  setPrincipal,
  updateOrder,
};
