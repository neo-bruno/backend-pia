// ============================================================
// PIA - MÓDULO RESERVA
// Capa: repository
// ============================================================

const pool = require("../../database/pool");
const notificacionService = require("../notificacion/notificacion.service");
const { emitirNotificacionCliente } = require("../../utils/socket");

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

// ============================================================
// OBTENER UNA RESERVA POR ID
// ============================================================

const getReservationById = async (profesionalId, reservaId) => {
  const query = `
    SELECT

      -- ======================================================
      -- RESERVA
      -- ======================================================

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
    -- SEGURIDAD
    --
    -- La reserva debe:
    -- 1. Ser la reserva solicitada.
    -- 2. Pertenecer al profesional autenticado.
    -- ========================================================

    WHERE r.id = $1
      AND pr.id = $2
      
    LIMIT 1;
  `;

  const values = [reservaId, profesionalId];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

// ============================================================
// CAMBIAR ESTADO DE UNA RESERVA
// ============================================================

const updateReservationStatus = async (profesionalId, reservaId, estado) => {
  const client = await pool.connect();

  let transaccionIniciada = false;
  const notificacionesParaEmitir = [];

  try {
    await client.query("BEGIN");
    transaccionIniciada = true;

    // ========================================================
    // 1. VERIFICAR Y BLOQUEAR LA RESERVA
    // ========================================================

    const reservaQuery = `
      SELECT
        r.id,
        r.numero,
        r.estado,
        r.cliente_id,
        r.servicio_id,
        s.nombre AS servicio_nombre
      FROM reserva r
      INNER JOIN servicio s
        ON s.id = r.servicio_id
      WHERE r.id = $1
        AND s.profesional_id = $2
      FOR UPDATE OF r;
    `;

    const reservaResult = await client.query(reservaQuery, [
      reservaId,
      profesionalId,
    ]);

    if (!reservaResult.rows.length) {
      await client.query("COMMIT");
      transaccionIniciada = false;
      return null;
    }

    const reserva = reservaResult.rows[0];

    // ========================================================
    // 2. ACTUALIZAR EL ESTADO
    // ========================================================

    let reservaActualizada;

    if (reserva.estado !== estado) {
      const updateQuery = `
        UPDATE reserva
        SET
          estado = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
          id,
          numero,
          fecha,
          hora_inicio,
          hora_fin,
          precio_original,
          monto_promocion,
          monto_descuento,
          precio_aplicable,
          monto_pagado,
          saldo,
          estado,
          created_at,
          updated_at;
      `;

      const updateResult = await client.query(updateQuery, [reservaId, estado]);

      reservaActualizada = updateResult.rows[0];
    } else {
      const actualQuery = `
        SELECT
          id,
          numero,
          fecha,
          hora_inicio,
          hora_fin,
          precio_original,
          monto_promocion,
          monto_descuento,
          precio_aplicable,
          monto_pagado,
          saldo,
          estado,
          created_at,
          updated_at
        FROM reserva
        WHERE id = $1;
      `;

      const actualResult = await client.query(actualQuery, [reservaId]);

      reservaActualizada = actualResult.rows[0];
    }

    // ========================================================
    // 3. GENERAR INVITACIONES PARA EVALUAR
    // ========================================================
    //
    // Se revisan también las reservas que ya estaban
    // COMPLETADAS, para permitir reconciliar invitaciones
    // si se vuelve a procesar su estado.
    // ========================================================

    if (estado === "COMPLETADA") {
      const evaluacionesQuery = `
        SELECT
          e.id AS evaluacion_id,
          tc.codigo,
          tc.tipo AS tipo_nombre,
          tc.objetivo
        FROM evaluacion e
        INNER JOIN tipo_calificacion tc
          ON tc.id = e.tipo_calificacion_id
        WHERE e.estado = 'HABILITADO'
        ORDER BY e.id;
      `;

      const evaluacionesResult = await client.query(evaluacionesQuery);

      for (const evaluacion of evaluacionesResult.rows) {
        // ----------------------------------------------------
        // 3.1. Verificar si ya calificó este criterio
        // ----------------------------------------------------

        const calificacionQuery = `
          SELECT 1
          FROM calificacion
          WHERE reserva_id = $1
            AND evaluacion_id = $2
          LIMIT 1;
        `;

        const calificacionResult = await client.query(calificacionQuery, [
          reservaId,
          evaluacion.evaluacion_id,
        ]);

        if (calificacionResult.rows.length) {
          continue;
        }

        // ----------------------------------------------------
        // 3.2. Verificar si ya existe una invitación
        // ----------------------------------------------------

        const notificacionQuery = `
          SELECT 1
          FROM notificacion
          WHERE cliente_id = $1
            AND reserva_id = $2
            AND evaluacion_id = $3
            AND tipo = 'EVALUACION_PENDIENTE'
          LIMIT 1;
        `;

        const notificacionResult = await client.query(notificacionQuery, [
          reserva.cliente_id,
          reservaId,
          evaluacion.evaluacion_id,
        ]);

        if (notificacionResult.rows.length) {
          continue;
        }

        // ----------------------------------------------------
        // 3.3. Crear notificación para el cliente
        // ----------------------------------------------------

        const nombreCriterio = evaluacion.tipo_nombre || evaluacion.codigo;

        const notificacionCreada = await notificacionService.crearNotificacion(
          client,
          {
            cliente_id: reserva.cliente_id,
            reserva_id: reservaId,
            evaluacion_id: evaluacion.evaluacion_id,
            servicio_id: reserva.servicio_id,

            titulo: "¡Cuéntanos tu experiencia!",

            mensaje:
              `Tu reserva del servicio "${reserva.servicio_nombre}" ` +
              `ha sido completada. Puedes calificar: ${nombreCriterio}.`,

            tipo: "EVALUACION_PENDIENTE",
          },
        );

        if (notificacionCreada) {
          notificacionesParaEmitir.push(notificacionCreada);
        }
      }
    }

    // ========================================================
    // 4. CONFIRMAR TODAS LAS OPERACIONES
    // ========================================================

    await client.query("COMMIT");
    transaccionIniciada = false;

    // Emitir únicamente las notificaciones que se crearon.
    // La transacción ya está confirmada.
    for (const notificacion of notificacionesParaEmitir) {
      emitirNotificacionCliente(reserva.cliente_id, notificacion);
    }

    return reservaActualizada || null;
  } catch (error) {
    if (transaccionIniciada) {
      await client.query("ROLLBACK");
    }

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getReservations,
  getReservationById,
  updateReservationStatus,
};
