// ============================================================
// VALIDACIONES DE FAVORITOS
// ============================================================

const TIPOS_FAVORITO = ["NEGOCIO", "PROFESIONAL", "SERVICIO"];

// ============================================================
// VALIDAR CREAR FAVORITO
// ============================================================

function validarCrearFavorito(req, res, next) {
  try {
    const { tipo, id } = req.body;

    if (!tipo) {
      return res.status(400).json({
        ok: false,
        mensaje: "El tipo de favorito es obligatorio.",
      });
    }

    const tipoNormalizado = String(tipo).trim().toUpperCase();

    if (!TIPOS_FAVORITO.includes(tipoNormalizado)) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El tipo de favorito debe ser NEGOCIO, PROFESIONAL o SERVICIO.",
      });
    }

    if (
      id === undefined ||
      id === null ||
      id === "" ||
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id del favorito no es válido.",
      });
    }

    req.body.tipo = tipoNormalizado;
    req.body.id = Number(id);

    next();
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: "Datos de favorito no válidos.",
    });
  }
}

// ============================================================
// VALIDAR ELIMINAR FAVORITO
// ============================================================

function validarEliminarFavorito(req, res, next) {
  try {
    const tipo = String(req.params.tipo || "")
      .trim()
      .toUpperCase();

    const id = Number(req.params.id);

    if (!TIPOS_FAVORITO.includes(tipo)) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El tipo de favorito debe ser NEGOCIO, PROFESIONAL o SERVICIO.",
      });
    }

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id del favorito no es válido.",
      });
    }

    req.params.tipo = tipo;
    req.params.id = id;

    next();
  } catch (error) {
    return res.status(400).json({
      ok: false,
      mensaje: "Datos de favorito no válidos.",
    });
  }
}

module.exports = {
  validarCrearFavorito,
  validarEliminarFavorito,
};
