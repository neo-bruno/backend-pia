const service = require("./auth.service");

const login = async (req, res, next) => {
  try {
    const { telefono, password } = req.body;

    const resultado = await service.login(telefono, password);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
