const express = require("express");
const controller = require("./tipoprofesional.controller");

// const { verifyToken } = require("../../middlewares/auth.middleware");
// const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

router.get("/", controller.listar);


module.exports = router;
