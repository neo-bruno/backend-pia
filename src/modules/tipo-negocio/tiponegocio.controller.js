const service = require("./tiponegocio.service");

const listar = async (req, res, next) => {
  try {
    const tiposnegocio = await service.listar();

    res.status(200).json({
      ok: true,
      data: tiposnegocio,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
};
