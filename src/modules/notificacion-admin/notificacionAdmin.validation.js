const validarIdNotificacion = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      ok: false,
      message: "ID de notificación inválido",
    });
  }

  next();
};

module.exports = {
  validarIdNotificacion,
};
