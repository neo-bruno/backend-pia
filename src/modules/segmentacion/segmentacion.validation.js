const validarClienteId = (req, res, next) => {
  const clienteId = Number(req.params.clienteId);

  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    return res.status(400).json({
      ok: false,
      message: "El identificador del cliente no es válido",
    });
  }

  next();
};

module.exports = {
  validarClienteId,
};
