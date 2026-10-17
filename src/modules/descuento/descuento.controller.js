const service = require("./descuento.service");

const obtenerContexto = (req) => ({
  profesionalId: req.usuario?.profesional_id,
  negocioId: req.usuario?.negocio_id,
});

const listarDescuentos = async (req, res, next) => {
  try {
    const data = await service.listarDescuentos(
      obtenerContexto(req),
      req.query,
    );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const obtenerDescuento = async (req, res, next) => {
  try {
    const data = await service.obtenerDescuento(
      obtenerContexto(req),
      req.params.id,
    );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const crearDescuento = async (req, res, next) => {
  try {
    const data = await service.crearDescuento(obtenerContexto(req), req.body);

    res.status(201).json({
      ok: true,
      message: "Descuento creado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const actualizarDescuento = async (req, res, next) => {
  try {
    const data = await service.actualizarDescuento(
      obtenerContexto(req),
      req.params.id,
      req.body,
    );

    res.status(200).json({
      ok: true,
      message: "Descuento actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const cambiarEstadoDescuento = async (req, res, next) => {
  try {
    const data = await service.cambiarEstadoDescuento(
      obtenerContexto(req),
      req.params.id,
      req.body.estado,
    );

    res.status(200).json({
      ok: true,
      message: "Estado del descuento actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarDescuentos,
  obtenerDescuento,
  crearDescuento,
  actualizarDescuento,
  cambiarEstadoDescuento,
};
