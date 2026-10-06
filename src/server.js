const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const { port } = require("./config/env");
const { verificarToken } = require("./utils/jwt");

const httpServer = http.createServer(app);

const { configurarSocketIO } = require("./utils/socket");

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

configurarSocketIO(io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Token de autenticación requerido"));
    }

    const usuario = verificarToken(token);

    if (usuario.rol !== "ADMIN") {
      return next(new Error("Acceso no autorizado"));
    }

    if (!usuario.profesional_id) {
      return next(new Error("Profesional no asociado"));
    }

    socket.data.usuario = usuario;

    next();
  } catch (error) {
    next(new Error("Token inválido o expirado"));
  }
});

io.on("connection", (socket) => {
  const profesionalId = socket.data.usuario.profesional_id;

  const sala = `profesional:${profesionalId}`;

  socket.join(sala);

  console.log(
    `🔌 Socket conectado - profesional ${profesionalId} - sala ${sala}`,
  );
});

httpServer.listen(port, () => {
  console.log(`PIA Backend funcionando en puerto ${port}`);
});
