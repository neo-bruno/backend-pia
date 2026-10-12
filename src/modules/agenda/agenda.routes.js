// =====================================================
// agenda.routes.js
// =====================================================

const express = require("express");
const router = express.Router();

const controller = require("./agenda.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// =====================================================
// AGENDA
// =====================================================

router.get(
  "/",
  verifyToken,
  allowRoles("ADMIN", "SUPERADMIN"),
  controller.getAgenda,
);

module.exports = router;
