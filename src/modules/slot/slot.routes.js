const express = require("express");
const controller = require("./slot.controller");

const { allowRoles } = require("../../middlewares/role.middleware");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { validarProfesional, validarSlots } = require("./slot.validation");

const router = express.Router();

router.get("/", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), validarProfesional, controller.getSlots);
router.post("/", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), validarSlots, controller.saveSlots);

module.exports = router;
