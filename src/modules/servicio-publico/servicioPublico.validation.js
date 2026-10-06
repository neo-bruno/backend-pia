const { param, validationResult } = require("express-validator");

function validarServicioId(req, res, next) {
  const { servicioId } = req.params;

  const id = Number(servicioId);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      ok: false,
      message: "El servicioId no es válido",
    });
  }

  next();
}

const validarProfesionalId = [
  param("profesionalId")
    .isInt({ min: 1 })
    .withMessage("El ID del profesional no es válido"),

  (req, res, next) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: "Datos inválidos",
        errores: errores.array(),
      });
    }

    next();
  },
];

module.exports = {
  validarProfesionalId,
  validarServicioId,
};
