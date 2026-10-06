const service = require("./tipoprofesional.service");

const listar = async (req, res, next) => {
  try {
    const tiposProfesionales = await service.listar();

    res.status(200).json({
      ok: true,
      data: tiposProfesionales,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
};
