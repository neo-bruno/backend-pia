// ============================================================
// PIA - MÓDULO RESERVA
// Capa: repository
// ============================================================

const pool = require("../../database/pool");

// ============================================================
// OBTENER RESERVAS DEL PROFESIONAL
// ============================================================

const getReservations = async (profesionalId, fecha) => {
  const query = `
    SELECT

      r.id,
      r.numero,

      r.fecha,
      r.hora_inicio,
      r.hora_fin,

      r.precio_original,
      r.monto_promocion,
      r.monto_descuento,
      r.precio_aplicable,
      r.monto_pagado,
      r.saldo,

      r.estado,

      r.created_at,
      r.updated_at,

      -- ======================================================
      -- CLIENTE
      -- ======================================================

      c.id AS cliente_id,
      p.nombre AS cliente_nombre,
      p.telefono AS cliente_telefono,

      -- ======================================================
      -- SERVICIO
      -- ======================================================

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      -- ======================================================
      -- PAGO
      -- ======================================================

      pago.id AS pago_id,
      pago.numero AS pago_numero,
      pago.monto AS pago_monto,
      pago.estado AS pago_estado,

      -- ======================================================
      -- COMPROBANTE
      -- ======================================================

      comprobante.id AS comprobante_id,
      comprobante.estado AS comprobante_estado,

      archivo.id AS comprobante_archivo_id,
      archivo.nombre AS comprobante_nombre,
      archivo.url AS comprobante_url,
      archivo.mime_type AS comprobante_mime_type

    FROM reserva r

    -- ========================================================
    -- CLIENTE
    -- ========================================================

    INNER JOIN cliente c
      ON c.id = r.cliente_id

    INNER JOIN persona p
      ON p.id = c.persona_id

    -- ========================================================
    -- SERVICIO
    -- ========================================================

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    -- ========================================================
    -- PROFESIONAL
    --
    -- RESERVA no tiene profesional_id.
    -- El profesional se determina mediante SERVICIO.
    -- ========================================================

    INNER JOIN profesional pr
      ON pr.id = s.profesional_id

    -- ========================================================
    -- PAGO
    -- ========================================================

    LEFT JOIN LATERAL (
      SELECT
        pg.id,
        pg.numero,
        pg.monto,
        pg.estado
      FROM pago pg
      WHERE pg.reserva_id = r.id
      ORDER BY pg.id DESC
      LIMIT 1
    ) pago ON TRUE

    -- ========================================================
    -- COMPROBANTE
    -- ========================================================

    LEFT JOIN LATERAL (
      SELECT
        cp.id,
        cp.archivo_id,
        cp.estado
      FROM comprobante cp
      WHERE cp.pago_id = pago.id
      ORDER BY cp.id DESC
      LIMIT 1
    ) comprobante ON TRUE

    LEFT JOIN archivo
      ON archivo.id = comprobante.archivo_id

    -- ========================================================
    -- FILTROS
    -- ========================================================

    WHERE pr.id = $1

      AND r.estado IN (
        'PENDIENTE',
        'CONFIRMADA'
      )

      AND r.fecha = COALESCE(
        $2::DATE,
        CURRENT_DATE
      )

    -- ========================================================
    -- ORDEN
    -- ========================================================

    ORDER BY
      r.hora_inicio ASC,
      r.id ASC;
  `;

  const values = [profesionalId, fecha || null];

  const { rows } = await pool.query(query, values);

  return rows;
};

module.exports = {
  getReservations,
};
