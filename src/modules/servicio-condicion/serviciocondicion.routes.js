const express = require("express");

const controller = require("./serviciocondicion.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");

const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// ============================================================
// SERVICIO - CONDICIÓN
// ============================================================

// Listar condiciones de un servicio
router.get(
  "/servicio/:servicioId",
  verifyToken,
  allowRoles("ADMIN", "SUPERADMIN"),
  controller.getConditionsByService,
);

// Crear condición para un servicio
router.post(
  "/servicio/:servicioId",
  verifyToken,
  allowRoles("ADMIN"),
  controller.createCondition,
);

// Obtener una condición
router.get(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "SUPERADMIN"),
  controller.getConditionById,
);

// Editar condición
router.put(
  "/:id",
  verifyToken,
  allowRoles("ADMIN"),
  controller.updateCondition,
);

// Eliminar condición
router.delete(
  "/:id",
  verifyToken,
  allowRoles("ADMIN"),
  controller.deleteCondition,
);

module.exports = router;
