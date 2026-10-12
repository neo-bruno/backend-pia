const express = require("express");

const router = express.Router();

const controller = require("./evaluacion.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================================
// PIA - MÓDULO EVALUACIÓN
// Capa: routes
// ============================================================

// ============================================================
// EVALUACIONES - SUPERADMIN
// ============================================================

// GET /api/evaluacion
router.get("/", verifyToken, allowRoles("SUPERADMIN"), controller.getEvaluaciones);

// GET /api/evaluacion/:id
router.get("/:id", verifyToken, allowRoles("SUPERADMIN"), controller.getEvaluacionById);

// POST /api/evaluacion
router.post("/", verifyToken, allowRoles("SUPERADMIN"), controller.createEvaluacion);

// PATCH /api/evaluacion/:id/estado
router.patch("/:id/estado", verifyToken, allowRoles("SUPERADMIN"), controller.updateEstadoEvaluacion);

module.exports = router;
