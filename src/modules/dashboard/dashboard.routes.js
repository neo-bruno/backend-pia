// ============================================================
// PIA - MÓDULO DASHBOARD
// Capa: routes
// ============================================================

const express = require("express");
const router = express.Router();

const controller = require("./dashboard.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// Dashboard del negocio
router.get("/", verifyToken, allowRoles("ADMIN"), controller.obtenerDashboard);

module.exports = router;
