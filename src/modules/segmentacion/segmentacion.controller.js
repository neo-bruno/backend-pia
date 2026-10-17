const service = require("./segmentacion.service");

const getSegmentacion = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const data = await service.getSegmentacion(profesionalId);

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSegmentacionCliente = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const { clienteId } = req.params;

    const data = await service.getSegmentacionCliente(profesionalId, clienteId);

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getHistorialSegmentacionCliente = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const { clienteId } = req.params;

    const data = await service.getHistorialSegmentacionCliente(
      profesionalId,
      clienteId,
    );

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSegmentacion,
  getSegmentacionCliente,
  getHistorialSegmentacionCliente,
};
