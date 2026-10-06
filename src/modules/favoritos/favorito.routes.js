const express = require("express");

const controller = require("./favorito.controller");

const { validarCrearFavorito, validarEliminarFavorito } = require("./favorito.validation");

const router = express.Router();

// ============================================================
// FAVORITOS DEL CLIENTE
// ============================================================

// GET /api/favorito
router.get("/", controller.obtenerFavoritos);

// ============================================================
// AGREGAR FAVORITO
// ============================================================

// POST /api/favorito
//
// Body:
// {
//   "tipo": "NEGOCIO",
//   "id": 1
// }

router.post("/", validarCrearFavorito, controller.crearFavorito);

// ============================================================
// ESTADO DE FAVORITO
// ============================================================

// GET /api/favorito/NEGOCIO/1
// GET /api/favorito/PROFESIONAL/5
// GET /api/favorito/SERVICIO/8

router.get("/:tipo/:id", validarEliminarFavorito, controller.obtenerEstadoFavorito);

// ============================================================
// ELIMINAR FAVORITO
// ============================================================

// DELETE /api/favorito/NEGOCIO/1

router.delete("/:tipo/:id", validarEliminarFavorito, controller.eliminarFavorito);

module.exports = router;
