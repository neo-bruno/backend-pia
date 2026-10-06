const express = require("express");
const controller = require("./comprobante.controller");

const { allowRoles } = require("../../middlewares/role.middleware");
const { verifyToken } = require("../../middlewares/auth.middleware");

const router = express.Router();

/*
 * Comprobantes pendientes
 */
router.get("/", verifyToken, allowRoles("SUPERADMIN"), controller.getVoucher);

/*
 * Obtener un comprobante específico
 */
router.get("/:id", verifyToken, allowRoles("SUPERADMIN"), controller.getVoucherById);

/*
 * Aceptar o rechazar comprobante
 */
router.put("/:id/validar", verifyToken, allowRoles("SUPERADMIN"), controller.validateVoucher);

module.exports = router;
