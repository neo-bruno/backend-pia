const pool = require("../../database/pool");

const repository = require("./comprobante.repository");

const { validateVoucherValidation } = require("./comprobante.validation");

async function getPendingVouchers() {
  return await repository.getPendingVouchers();
}

async function getVoucherById(comprobanteId) {
  if (!comprobanteId) {
    throw new Error("El ID del comprobante es obligatorio");
  }

  const comprobante = await repository.getVoucherById(comprobanteId);

  if (!comprobante) {
    throw new Error("El comprobante no existe");
  }

  return comprobante;
}

async function validateVoucher(comprobanteId, data) {
  const validation = validateVoucherValidation(data);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Obtenemos nuevamente el comprobante desde la BD.
     * No confiamos en IDs enviados desde el frontend.
     */
    const comprobante = await repository.getVoucherById(comprobanteId);

    if (!comprobante) {
      throw new Error("El comprobante no existe");
    }

    if (comprobante.comprobante_estado !== "PENDIENTE") {
      throw new Error(
        `El comprobante ya fue ${comprobante.comprobante_estado.toLowerCase()}`,
      );
    }

    /*
     * Obtenemos la Gerencia responsable de la validación.
     */
    const gerencia = await repository.getActiveManagement(client);

    if (!gerencia) {
      throw new Error(
        "No existe una gerencia activa para validar el comprobante",
      );
    }

    const datos = {
      comprobanteId,
      gerenciaId: gerencia.id,

      membresiaId: comprobante.membresia_id,
      profesionalNegocioId: comprobante.profesional_negocio_id,
      profesionalId: comprobante.profesional_id,
      negocioId: comprobante.negocio_id,

      observacion: validation.observacion,
    };

    if (validation.estado === "ACEPTADO") {
      await repository.acceptVoucher(client, datos);
    }

    if (validation.estado === "RECHAZADO") {
      await repository.rejectVoucher(client, datos);
    }

    await client.query("COMMIT");

    return await repository.getVoucherById(comprobanteId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPendingVouchers,
  getVoucherById,
  validateVoucher,
};
