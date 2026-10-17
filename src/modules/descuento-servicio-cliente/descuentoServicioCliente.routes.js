const express = require("express");
const router = express.Router();

const controller = require("./descuentoServicioCliente.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.use(verifyToken);
router.use(allowRoles("ADMIN"));

// Descuentos vigentes de tipo CLIENTE
router.get("/disponibles/:clienteId", controller.listarDescuentosDisponibles);

// Asignar descuentos a un cliente
router.post("/asignar/:clienteId", controller.asignarDescuentos);

router.delete("/asignacion/:asignacionId", controller.retirarAsignacion);

module.exports = router;
