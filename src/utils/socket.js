
let io = null;

// ============================================================
// CONFIGURAR SOCKET.IO
// ============================================================

function configurarSocketIO(socketIO) {
  io = socketIO;
}

// ============================================================
// NOTIFICAR AL PROFESIONAL
// ============================================================

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

// ============================================================
// NOTIFICAR AL CLIENTE
// ============================================================

function emitirNotificacionCliente(clienteId, datos) {
  if (!io) {
    console.warn("⚠️ Socket.IO todavía no está configurado");
    return;
  }

  if (!clienteId) {
    console.warn("⚠️ No se puede notificar: falta el ID del cliente");
    return;
  }

  const sala = `cliente:${clienteId}`;

  io.to(sala).emit("nueva_notificacion", datos);

  console.log(
    `📢 Notificación enviada por Socket.IO - cliente ${clienteId}`,
  );
}

// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  configurarSocketIO,
  emitirNotificacionProfesional,
  emitirNotificacionCliente,
};
