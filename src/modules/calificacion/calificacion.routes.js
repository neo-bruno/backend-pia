const express = require("express");

const controller = require("./calificacion.controller");

const { validarRegistrarCalificacion } = require("./calificacion.validation");

const router = express.Router();

// ============================================================
// REGISTRAR CALIFICACIÓN DE UNA RESERVA
// ============================================================
router.post("/", validarRegistrarCalificacion, controller.registrarCalificacion);

// ============================================================
// CONSULTAR CALIFICACIÓN DE UNA RESERVA
// ============================================================
router.get("/reserva/:reservaId/evaluacion/:evaluacionId", controller.obtenerCalificacion);

module.exports = router;
