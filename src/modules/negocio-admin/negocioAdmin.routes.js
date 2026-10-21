const express = require("express");
const router = express.Router();

const controller = require("./negocioAdmin.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");
const upload = require("../../middlewares/negocioarchivo.upload");

router.get(
	"/mi-negocio",
	verifyToken,
	allowRoles("ADMIN"),
	controller.obtenerMiNegocio,
);

router.put(
	"/mi-negocio",
	verifyToken,
	allowRoles("ADMIN"),
	controller.actualizarMiNegocio,
);

router.put(
	"/mi-negocio/pagina",
	verifyToken,
	allowRoles("ADMIN"),
	controller.actualizarPaginaNegocio,
);

router.get(
	"/tipos",
	verifyToken,
	allowRoles("ADMIN"),
	controller.listarTiposNegocio,
);

router.patch(
	"/mi-negocio/imagenes",
	verifyToken,
	allowRoles("ADMIN"),
	upload.fields([
		{ name: "portada", maxCount: 1 },
		{ name: "logo", maxCount: 1 },
	]),
	controller.actualizarImagenesNegocio,
);

module.exports = router;
