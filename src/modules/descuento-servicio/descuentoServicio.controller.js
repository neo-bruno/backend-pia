const service = require("./descuentoServicio.service");
const validation = require("./descuentoServicio.validation");

const obtenerContexto = (req) => ({
  negocioId: req.usuario?.negocio_id,
  profesionalId: req.usuario?.profesional_id,
});

const listarServiciosPorDescuento = async (req, res, next) => {
  try {
    const resultado = await service.listarServiciosPorDescuento(
      obtenerContexto(req),
      req.params.descuentoId,
    );

    res.json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

const guardarAsociaciones = async (req, res, next) => {
  try {
    const servicios = validation.validarGuardarAsociaciones(req.body);

    const resultado = await service.guardarAsociaciones(
      obtenerContexto(req),
      req.params.descuentoId,
      servicios,
    );

    res.json({
      ok: true,
      mensaje: "Asociaciones guardadas correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarServiciosPorDescuento,
  guardarAsociaciones,
};
