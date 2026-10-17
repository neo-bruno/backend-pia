const express = require("express");
const router = express.Router();

const controller = require("./descuento.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// Todas las rutas requieren autenticación.
router.use(verifyToken);
router.use(allowRoles("ADMIN"));

// Listar descuentos propios
router.get("/", controller.listarDescuentos);

// Consultar un descuento propio
router.get("/:id", controller.obtenerDescuento);

// Crear descuento
router.post("/", controller.crearDescuento);

// Editar descuento
router.put("/:id", controller.actualizarDescuento);

// Activar o desactivar
router.patch("/:id/estado", controller.cambiarEstadoDescuento);

module.exports = router;
