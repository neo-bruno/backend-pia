// ============================================================
// PIA - MÓDULO BLOQUEO
// Capa: routes
// ============================================================

const express = require("express");

const router = express.Router();

const controller = require("./bloqueo.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================================
// CREAR BLOQUEO DE HORARIO
// POST /api/bloqueo
// ============================================================

router.post("/", verifyToken, allowRoles("ADMIN"), controller.crearBloqueo);

// ============================================================
// OBTENER BLOQUEOS POR FECHA
// GET /api/bloqueo?negocio_id=1&fecha=2026-10-12
// ============================================================

router.get(
  "/",
  verifyToken,
  allowRoles("ADMIN"),
  controller.obtenerBloqueosPorFecha,
);

// ============================================================
// CANCELAR BLOQUEO
// PATCH /api/bloqueo/:id/cancelar
// ============================================================

router.patch(
  "/:id/cancelar",
  verifyToken,
  allowRoles("ADMIN"),
  controller.cancelarBloqueo,
);

module.exports = router;
