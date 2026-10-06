const express = require("express");
const controller = require("./horario.controller");
const { allowRoles } = require("../../middlewares/role.middleware");
const { verifyToken } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post('/', verifyToken, allowRoles('ADMIN', 'SUPERADMIN'), controller.saveBusinessHours);
router.get('/', verifyToken, allowRoles('ADMIN', 'SUPERADMIN'), controller.getBusinessHours)

module.exports = router;
