const express = require("express");
const router = express.Router();

const controller = require("./tipocalificacion.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================
// TIPOS DE CALIFICACIÓN
// ============================================

// LISTAR
router.get(
  "/",
  verifyToken,
  allowRoles("SUPERADMIN"),
  controller.getTiposCalificacion,
);

// CONSULTAR POR ID
router.get(
  "/:id",
  verifyToken,
  allowRoles("SUPERADMIN"),
  controller.getTipoCalificacionById,
);

// CREAR
router.post(
  "/",
  verifyToken,
  allowRoles("SUPERADMIN"),
  controller.createTipoCalificacion,
);

// EDITAR
router.put(
  "/:id",
  verifyToken,
  allowRoles("SUPERADMIN"),
  controller.updateTipoCalificacion,
);

// CAMBIAR ESTADO
router.patch(
  "/:id/estado",
  verifyToken,
  allowRoles("SUPERADMIN"),
  controller.updateEstadoTipoCalificacion,
);

module.exports = router;
