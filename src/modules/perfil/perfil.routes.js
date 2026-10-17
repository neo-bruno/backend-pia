const express = require("express");
const controller = require("./perfil.controller");

const upload = require("../../middlewares/profesional.upload");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// Todas las rutas requieren autenticación y rol autorizado.
router.use(verifyToken, allowRoles("ADMIN", "SUPERADMIN"));

// Consultar perfil
router.get("/", controller.obtenerPerfil);

// Actualizar perfil y fotografía
router.put(
	"/",
	upload.fields([{ name: "foto", maxCount: 1 }]),
	controller.actualizarPerfil,
);

module.exports = router;
