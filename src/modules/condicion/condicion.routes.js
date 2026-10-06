const express = require("express");

const controller = require("./condicion.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// ============================================================
// CONDICIONES
// ============================================================

// Obtener una condición
router.get(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "SUPERADMIN"),
  controller.getConditionById,
);

// Crear condición
router.post("/", verifyToken, allowRoles("ADMIN"), controller.createCondition);

// Editar condición
router.put(
  "/:id",
  verifyToken,
  allowRoles("ADMIN"),
  controller.updateCondition,
);

module.exports = router;
