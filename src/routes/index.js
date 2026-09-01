const express = require("express");
const rolRoutes = require("../modules/rol");
const authRoutes = require('../modules/auth')
const usuarioRoutes = require('../modules/usuario')

const router = express.Router();

router.use("/rol", rolRoutes);
router.use('/auth', authRoutes)
router.use('/usuario', usuarioRoutes)

module.exports = router;
