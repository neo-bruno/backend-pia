const allowRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        message: "No tiene permisos para realizar esta acción",
      });
    }

    next();
  };
};

module.exports = {
  allowRoles,
};
