const service = require("./usuario.service");

const crear = async (req, res, next) => {
  try {
    const resultado = await service.crear(req.body);

    res.status(201).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crear,
};
