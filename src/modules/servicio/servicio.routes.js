const express = require("express");

const controller = require("./servicio.controller");
const upload = require("../../middlewares/servicio.upload");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// ============================================================
// SERVICIOS
// ============================================================

// Crear servicio
router.post("/", verifyToken, allowRoles("ADMIN"),
  upload.fields([
    { name: "fotos", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  controller.saveService,
);

// Listar servicios del profesional autenticado
router.get("/", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), controller.getServices);

// Obtener detalle de un servicio
router.get("/:id", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), controller.getServiceById);

// Editar servicio
router.put("/:id", verifyToken, allowRoles("ADMIN"), controller.updateService);

// Habilitar / deshabilitar servicio
router.patch("/:id/estado", verifyToken, allowRoles("ADMIN"), controller.updateServiceStatus);

module.exports = router;
