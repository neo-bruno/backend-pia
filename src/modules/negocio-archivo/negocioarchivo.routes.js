const express = require("express");

const router = express.Router();

const controller = require("./negocioarchivo.controller");
const upload = require("../../middlewares/negocioarchivo.upload");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================================
// GALERÍA DEL NEGOCIO - ADMIN
// ============================================================

// Agregar fotos
router.post("/fotos", verifyToken, allowRoles("ADMIN"), upload.array("fotos", 5), controller.agregarFotos);

// Agregar videos
router.post("/videos", verifyToken, allowRoles("ADMIN"), upload.array("videos", 2), controller.agregarVideos);

// Listar galería
router.get("/", verifyToken, allowRoles("ADMIN"), controller.listarArchivos);

// Establecer foto principal
router.patch("/:id/principal", verifyToken, allowRoles("ADMIN"), controller.establecerPrincipal);

// Cambiar orden
router.patch("/:id/orden", verifyToken, allowRoles("ADMIN"), controller.cambiarOrden);

// Quitar archivo de la galería
router.delete("/:id", verifyToken, allowRoles("ADMIN"), controller.eliminarArchivo);

module.exports = router;
