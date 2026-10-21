const express = require("express");

const controller = require("./auth.controller");
const { validarLogin } = require("./auth.validation");
const { validate } = require("../../middlewares/validation.middleware");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// Inicio de sesión público
router.post("/login", validate(validarLogin), controller.login);

// Cambio de contraseña del usuario autenticado
router.put(
	"/cambiar-password",
	verifyToken,
	allowRoles("ADMIN", "SUPERADMIN"),
	controller.cambiarPassword,
);

module.exports = router;
