const { verificarToken } = require("../utils/jwt");

const verifyToken = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        ok: false,
        message: "Token de autenticación requerido",
      });
    }

    const [tipo, token] = authorization.split(" ");

    if (tipo !== "Bearer" || !token) {
      return res.status(401).json({
        ok: false,
        message: "Formato de token inválido",
      });
    }

    const usuario = verificarToken(token);

    req.usuario = usuario;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Token inválido o expirado",
    });
  }
};

module.exports = {
  verifyToken,
};
