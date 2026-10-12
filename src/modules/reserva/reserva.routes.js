// ============================================================
// PIA - MÓDULO RESERVA
// Capa: routes
// ============================================================

const express = require("express");

const router = express.Router();

const controller = require("./reserva.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================================
// RESERVAS DEL PROFESIONAL
// ============================================================

// GET /api/reserva
// GET /api/reserva?fecha=2026-10-05
router.get("/", verifyToken, allowRoles("ADMIN"), controller.getReservations);
router.get('/:id', verifyToken, allowRoles('ADMIN'), controller.getReservationById)

// ============================================================
// CAMBIAR ESTADO DE UNA RESERVA
// ============================================================
router.patch("/:id/estado", verifyToken, allowRoles("ADMIN"), controller.updateReservationStatus);

module.exports = router;
