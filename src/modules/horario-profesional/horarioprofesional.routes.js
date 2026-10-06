const express = require("express");

const controller = require("./horarioprofesional.controller");

const { allowRoles } = require("../../middlewares/role.middleware");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { validarAsignaciones } = require("./horarioprofesional.validation");

const router = express.Router();

router.post("/", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), validarAsignaciones, controller.saveProfessionalHours);
router.get('/', verifyToken, allowRoles('ADMIN', 'SUPERADMIN'), controller.getProfessionalHours)

module.exports = router;