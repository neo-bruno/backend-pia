const express = require("express");

const controller = require("./calificacion.controller");

const { validarRegistrarCalificacion } = require("./calificacion.validation");

const router = express.Router();

// ============================================================
// REGISTRAR CALIFICACIÓN DE UNA RESERVA
// ============================================================
router.post("/", validarRegistrarCalificacion, controller.registrarCalificacion);

module.exports = router;
