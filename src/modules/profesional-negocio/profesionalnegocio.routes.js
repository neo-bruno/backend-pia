const express = require("express");
const controller = require("./profesionalnegocio.controller");
const { allowRoles } = require("../../middlewares/role.middleware");
const { verifyToken } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get('/', verifyToken, allowRoles('ADMIN', 'SUPERADMIN'), controller.getProfessionalBusiness)

module.exports = router;
