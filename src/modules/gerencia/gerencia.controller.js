const service = require("./gerencia.service");

const getManagement = async (req, res, next) => {
  try {
    const gerencia = await service.getManagement();

    res.status(200).json({
      ok: true,
      data: gerencia,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManagement,
};
