let io = null;

function configurarSocketIO(socketIO) {
  io = socketIO;
}

function emitirNotificacionProfesional(profesionalId, datos) {
  if (!io) {
    console.warn("⚠️ Socket.IO todavía no está configurado");
    return;
  }

  const sala = `profesional:${profesionalId}`;

  io.to(sala).emit("nueva_notificacion", datos);

  console.log(
    `📢 Notificación enviada por Socket.IO - profesional ${profesionalId}`,
  );
}

module.exports = {
  configurarSocketIO,
  emitirNotificacionProfesional,
};
