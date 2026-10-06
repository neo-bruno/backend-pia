const service = require("./favorito.service");

// ============================================================
// CREAR FAVORITO
// ============================================================

async function crearFavorito(req, res) {
  try {
    const token = req.headers["x-cliente-token"];

    const { tipo, id } = req.body;

    const resultado = await service.crearFavorito({
      token,
      tipo,
      id,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Favorito agregado correctamente.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al crear favorito:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor.",
    });
  }
}

// ============================================================
// ELIMINAR FAVORITO
// ============================================================

async function eliminarFavorito(req, res) {
  try {
    const token = req.headers["x-cliente-token"];

    const tipo = req.params.tipo;
    const id = Number(req.params.id);

    const resultado = await service.eliminarFavorito({
      token,
      tipo,
      id,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Favorito eliminado correctamente.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al eliminar favorito:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor.",
    });
  }
}

// ============================================================
// OBTENER FAVORITOS DEL CLIENTE
// ============================================================

async function obtenerFavoritos(req, res) {
  try {
    const token = req.headers["x-cliente-token"];

    const resultado = await service.obtenerFavoritos({
      token,
    });

    return res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Error al obtener favoritos:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor.",
    });
  }
}

// ============================================================
// OBTENER ESTADO DE FAVORITO
// ============================================================

async function obtenerEstadoFavorito(req, res) {
  try {
    const token = req.headers["x-cliente-token"];

    const tipo = req.params.tipo;
    const id = Number(req.params.id);

    const resultado = await service.obtenerEstadoFavorito({
      token,
      tipo,
      id,
    });

    return res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Error al obtener estado de favorito:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor.",
    });
  }
}

module.exports = {
  crearFavorito,
  eliminarFavorito,
  obtenerFavoritos,
  obtenerEstadoFavorito,
};
