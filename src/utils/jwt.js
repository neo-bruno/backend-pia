const jwt = require("jsonwebtoken");

const authConfig = require("../config/auth");

const generarToken = (payload) => {
  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.expiresIn,
    algorithm: authConfig.algorithm,
  });
};

const verificarToken = (token) => {
  return jwt.verify(token, authConfig.secret, {
    algorithms: [authConfig.algorithm],
  });
};

module.exports = {
  generarToken,
  verificarToken,
};
