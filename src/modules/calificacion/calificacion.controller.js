const service = require("./calificacion.service");

// ============================================================
// REGISTRAR CALIFICACIÓN
// ============================================================

const registrarCalificacion = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    const tokenBearer =
      authorization && authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : null;

    const token = req.headers["x-cliente-token"] || tokenBearer;

    const calificacion = await service.registrarCalificacion({
      token,
      datos: req.body,
    });

    return res.status(201).json({
      ok: true,
      message: "Calificación registrada correctamente.",
      data: calificacion,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registrarCalificacion,
};
