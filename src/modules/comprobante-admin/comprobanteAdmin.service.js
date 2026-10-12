const pool = require("../../database/pool");
const notificacionRepository = require("../notificacion/notificacion.repository");

const repository = require("./comprobanteAdmin.repository");

// ============================================================
// OBTENER COMPROBANTE
// ============================================================

exports.obtenerComprobante = async (comprobanteId) => {
  const comprobante = await repository.obtenerComprobantePorId(comprobanteId);

  if (!comprobante) {
    const error = new Error("Comprobante no encontrado");
    error.statusCode = 404;
    throw error;
  }

  return comprobante;
};

// ============================================================
// CAMBIAR ESTADO
// ============================================================

exports.cambiarEstado = async (
  comprobanteId,
  estado,
  profesionalId,
  observacion = null,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ========================================================
    // OBTENER INFORMACIÓN DEL COMPROBANTE
    // ========================================================

    const comprobante = await repository.obtenerDatosComprobante(
      client,
      comprobanteId,
    );

    if (!comprobante) {
      await client.query("ROLLBACK");
      return null;
    }

    // ========================================================
    // ACTUALIZAR COMPROBANTE
    // ========================================================

    const actualizado = await repository.cambiarEstado(
      client,
      comprobanteId,
      estado,
      profesionalId,
      observacion,
    );

    if (!actualizado) {
      await client.query("ROLLBACK");
      return null;
    }

    // ========================================================
    // PREPARAR NOTIFICACIÓN AL CLIENTE
    // ========================================================

    let titulo = null;
    let mensaje = null;

    if (estado === "ACEPTADO") {
      titulo = "Comprobante aceptado";

      mensaje =
        `Tu comprobante de pago de la reserva #${comprobante.reserva_numero} ` +
        `fue aceptado correctamente.`;
    }

    if (estado === "RECHAZADO") {
      titulo = "Comprobante rechazado";

      mensaje =
        `Tu comprobante de pago de la reserva #${comprobante.reserva_numero} ` +
        `fue rechazado.`;

      if (observacion) {
        mensaje += ` Observación: ${observacion}`;
      }
    }

    // ========================================================
    // CREAR NOTIFICACIÓN SOLO PARA ACEPTADO / RECHAZADO
    // ========================================================

    if (titulo && mensaje) {
      await notificacionRepository.crearNotificacion(client, {
        cliente_id: comprobante.cliente_id,
        reserva_id: comprobante.reserva_id,
        pago_id: comprobante.pago_id,
        titulo,
        mensaje,
        tipo: "RESERVA",
      });
    }

    // ========================================================
    // CONFIRMAR TRANSACCIÓN
    // ========================================================

    await client.query("COMMIT");

    return actualizado;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error realizando ROLLBACK:", rollbackError);
    }

    console.error("Error cambiando estado del comprobante:", error);

    throw error;
  } finally {
    client.release();
  }
};
