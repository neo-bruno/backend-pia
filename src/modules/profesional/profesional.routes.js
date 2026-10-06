const express = require("express");
const controller = require("./profesional.controller");

const upload = require("../../middlewares/profesional.upload");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");
const { validarProfesional } = require("./profesional.validation");

const router = express.Router();

router.get('/todos', controller.getProfessionals)
router.get("/verificar-codigo/:codigo", controller.getVerificationCode);
router.get('/buscar/slug/:slug', controller.getProfessionalBySlug)
router.post("/", upload.single("comprobante"), controller.saveProfessional);

router.get("/", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), controller.getDataProfessional);
router.put("/", verifyToken, allowRoles("ADMIN", "SUPERADMIN"),upload.fields([
  { name: "foto", maxCount: 1 },
  { name: "portada", maxCount: 1 },
  { name: "qr", maxCount: 1 },
]), validarProfesional, controller.updateProfesional);


module.exports = router;
