const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const { port } = require("./config/env");
const { verificarToken } = require("./utils/jwt");
const pool = require("./database/pool");

const httpServer = http.createServer(app);

const { configurarSocketIO } = require("./utils/socket");

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

configurarSocketIO(io);

// ============================================================
// AUTENTICAR PROFESIONALES Y CLIENTES
// ============================================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Token de autenticación requerido"));
    }

    // --------------------------------------------------------
    // 1. INTENTAR AUTENTICACIÓN DEL PROFESIONAL
    // --------------------------------------------------------

    try {
      const usuario = verificarToken(token);

      if (usuario.rol === "ADMIN" && usuario.profesional_id) {
        socket.data.tipoUsuario = "PROFESIONAL";
        socket.data.usuario = usuario;

        return next();
      }
    } catch {
      // El token puede pertenecer a un cliente.
    }

    // --------------------------------------------------------
    // 2. AUTENTICAR CLIENTE CON SU TOKEN DE BASE DE DATOS
    // --------------------------------------------------------

    const resultado = await pool.query(
      `
        SELECT id
        FROM cliente
        WHERE token = $1
        LIMIT 1
      `,
      [token],
    );

    const cliente = resultado.rows[0];

    if (cliente) {
      socket.data.tipoUsuario = "CLIENTE";
      socket.data.clienteId = cliente.id;

      return next();
    }

    return next(new Error("Token inválido o acceso no autorizado"));
  } catch (error) {
    console.error("Error autenticando Socket.IO:", error.message);
    return next(new Error("Error al autenticar la conexión"));
  }
});

// ============================================================
// CONEXIÓN Y ASIGNACIÓN A SALAS PRIVADAS
// ============================================================

io.on("connection", (socket) => {
  // ----------------------------------------------------------
  // PROFESIONAL
  // ----------------------------------------------------------

  if (socket.data.tipoUsuario === "PROFESIONAL") {
    const profesionalId = socket.data.usuario.profesional_id;
    const sala = `profesional:${profesionalId}`;

    socket.join(sala);

    console.log(
      `🔌 Socket conectado - profesional ${profesionalId} - sala ${sala}`,
    );

    return;
  }

  // ----------------------------------------------------------
  // CLIENTE
  // ----------------------------------------------------------

  if (socket.data.tipoUsuario === "CLIENTE") {
    const clienteId = socket.data.clienteId;
    const sala = `cliente:${clienteId}`;

    socket.join(sala);

    console.log(`🔌 Socket conectado - cliente ${clienteId} - sala ${sala}`);
  }
});

httpServer.listen(port, () => {
  console.log(`PIA Backend funcionando en puerto ${port}`);
});
