const service = require('./horarioPublico.service')

const getAvailableSchedule = async (req, res) => {
  try {
    const profesionalId = req.params.profesionalId;
    const servicioId = req.params.servicioId;

    const { fecha } = req.query;

    // ============================================
    // TOKEN DEL CLIENTE
    // ============================================

    let clienteToken = null;

    const authorization = req.headers.authorization;

    if (authorization && authorization.startsWith("Bearer ")) {
      clienteToken = authorization.substring(7).trim();
    }

    // ============================================
    // BUSCAR CLIENTE
    // ============================================

    let clienteId = null;

    if (clienteToken) {
      clienteId = await obtenerClienteIdPorToken(clienteToken);
    }

    // ============================================
    // HORARIOS
    // ============================================

    const data = await service.getAvailableSchedule(
      profesionalId,
      fecha,
      clienteId,
      servicioId,
    );

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "No se encontraron horarios",
      });
    }

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error al obtener horarios públicos:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener los horarios",
      error: error.message,
    });
  }
};

const obtenerClienteIdPorToken = async (token) => {
  const pool = require("../../database/pool");

  const result = await pool.query(
    `
      SELECT id
      FROM cliente
      WHERE token = $1
      LIMIT 1
    `,
    [token],
  );

  if (!result.rows.length) {
    return null;
  }

  return Number(result.rows[0].id);
};

module.exports = {
  getAvailableSchedule,
};
