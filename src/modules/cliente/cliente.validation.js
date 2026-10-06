const validarAutenticarCliente = (req, res, next) => {
  const { telefono, alias } = req.body;

  // Teléfono obligatorio
  if (!telefono || typeof telefono !== "string") {
    return res.status(400).json({
      ok: false,
      mensaje: "El teléfono es obligatorio",
    });
  }

  const telefonoLimpio = telefono.trim();

  if (telefonoLimpio.length < 5 || telefonoLimpio.length > 30) {
    return res.status(400).json({
      ok: false,
      mensaje: "El teléfono no es válido",
    });
  }

  // Alias opcional.
  // Solo será obligatorio cuando el cliente todavía no exista.
  if (alias !== undefined && alias !== null) {
    if (typeof alias !== "string") {
      return res.status(400).json({
        ok: false,
        mensaje: "El alias debe ser un texto",
      });
    }

    if (alias.trim().length < 2 || alias.trim().length > 50) {
      return res.status(400).json({
        ok: false,
        mensaje: "El alias debe tener entre 2 y 50 caracteres",
      });
    }
  }

  req.body.telefono = telefonoLimpio;

  if (alias !== undefined && alias !== null) {
    req.body.alias = alias.trim();
  }

  next();
};

const { query, validationResult } = require("express-validator");

/**
 * VALIDAR BÚSQUEDA DE CLIENTE POR TELÉFONO
 */
const validarBuscarCliente = [
  query("telefono")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es obligatorio.")

    .matches(/^\+[1-9]\d{7,14}$/)
    .withMessage(
      "El teléfono debe tener un formato internacional válido. Ej: +59160515789",
    ),

  (req, res, next) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos.",
        errores: errores.array(),
      });
    }

    next();
  },
];

// =====================================================
// VALIDACIÓN LOGIN / REGISTRO CLIENTE
// =====================================================
function validarLoginRegisterCliente(req, res, next) {
  const { telefono, alias } = req.body;

  // --------------------------------------------------
  // TELÉFONO
  // --------------------------------------------------

  if (!telefono) {
    return res.status(400).json({
      ok: false,
      mensaje: "El teléfono es obligatorio",
    });
  }

  const telefonoNormalizado = String(telefono).replace(/\D/g, "");

  if (!/^[0-9]{8}$/.test(telefonoNormalizado)) {
    return res.status(400).json({
      ok: false,
      mensaje: "El teléfono debe contener 8 dígitos",
    });
  }

  // --------------------------------------------------
  // ALIAS
  // --------------------------------------------------
  //
  // El alias solamente es obligatorio
  // cuando se está registrando un cliente nuevo.
  //
  // Como todavía no sabemos si existe,
  // aquí solamente validamos cuando viene informado.
  //

  if (alias !== null && alias !== undefined) {
    if (typeof alias !== "string" || alias.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        mensaje: "El alias debe tener al menos 2 caracteres",
      });
    }

    if (alias.trim().length > 100) {
      return res.status(400).json({
        ok: false,
        mensaje: "El alias no puede superar los 100 caracteres",
      });
    }
  }

  // --------------------------------------------------
  // NORMALIZAR
  // --------------------------------------------------

  req.body.telefono = telefonoNormalizado;

  if (typeof alias === "string") {
    req.body.alias = alias.trim();
  }

  next();
}

module.exports = {
  validarLoginRegisterCliente,

  validarBuscarCliente,
  validarAutenticarCliente,
};
