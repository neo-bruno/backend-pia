const service = require("./rol.service");

const listar = async (req, res, next) => {
  try {
    const roles = await service.listar();

    res.status(200).json({
      ok: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rol = await service.buscarPorId(id);

    res.status(200).json({
      ok: true,
      data: rol,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  buscarPorId,
};
