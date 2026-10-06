const express = require("express");

const controller = require("./servicioarchivo.controller");
const upload = require("../../middlewares/servicio.upload");

const { verifyToken } = require("../../middlewares/auth.middleware");

const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// ============================================================
// AGREGAR FOTOS
// ============================================================

router.post(
  "/servicio/:servicioId",
  verifyToken,
  allowRoles("ADMIN"),
  upload.array("fotos", 5),
  controller.createFile,
);

// ============================================================
// AGREGAR VIDEOS
// ============================================================

router.post(
  "/servicio/:servicioId/videos",
  verifyToken,
  allowRoles("ADMIN"),
  upload.array("videos", 2),
  controller.createFileVideo,
);

// ============================================================
// LISTAR
// ============================================================

router.get(
  "/servicio/:servicioId",
  verifyToken,
  allowRoles("ADMIN", "SUPERADMIN"),
  controller.getFilesByService,
);

// ============================================================
// ELIMINAR
// ============================================================

router.delete("/:id", verifyToken, allowRoles("ADMIN"), controller.deleteFile);

// ============================================================
// PRINCIPAL
// ============================================================
router.patch(
  "/:id/principal",
  verifyToken,
  allowRoles("ADMIN"),
  controller.setPrincipal,
);

// ============================================================
// ORDEN
// ============================================================
router.patch(
  "/:id/orden",
  verifyToken,
  allowRoles("ADMIN"),
  controller.updateOrder,
);

module.exports = router;
