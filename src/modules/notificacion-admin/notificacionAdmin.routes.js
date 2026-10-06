const express = require("express");

const router = express.Router();

const controller = require("./notificacionAdmin.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================================
// NOTIFICACIONES DEL ADMIN / PROFESIONAL
// ============================================================

// Todas
router.get("/", verifyToken, allowRoles("ADMIN"), controller.getNotificaciones);

// Solamente no leídas
router.get("/no-leidas", verifyToken, allowRoles("ADMIN"), controller.getNotificacionesNoLeidas);

// Una específica
router.get("/:id", verifyToken, allowRoles("ADMIN"), controller.getNotificacionById);

// Marcar todas como leídas
router.patch("/leer-todas", verifyToken, allowRoles("ADMIN"), controller.marcarTodasComoLeidas);

// Marcar una como leída
router.patch("/:id/leer", verifyToken, allowRoles("ADMIN"), controller.marcarComoLeida);

module.exports = router;