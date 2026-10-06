const express = require("express");

const router = express.Router();

const controller = require("./notificacion.controller");
const validation = require("./notificacion.validation");

// ============================================================
// NOTIFICACIONES DEL CLIENTE
// ============================================================

// Obtener todas las notificaciones
router.get("/", controller.getNotificaciones);

// Obtener solamente las no leídas
router.get("/no-leidas", controller.getNotificacionesNoLeidas);

// Obtener una notificación específica
router.get("/:id", validation.validarId, controller.getNotificacionById);

// Marcar una notificación como leída
router.patch("/:id/leer", validation.validarId, controller.marcarComoLeida);

// Marcar todas las notificaciones como leídas
router.patch("/leer-todas", controller.marcarTodasComoLeidas);

module.exports = router;
