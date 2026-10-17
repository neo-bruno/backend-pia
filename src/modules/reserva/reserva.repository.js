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
  const notificacionesCreadas = [];
  let reservaActualizada = null;
  let clienteId = null;

  try {
    await client.query("BEGIN");
    transaccionIniciada = true;

    // ========================================================
    // OBTENER Y BLOQUEAR LA RESERVA
    // ========================================================

    const reservaQuery = `
      SELECT
        r.id,
        r.numero,
        r.estado,
        r.cliente_id,
        r.servicio_id,
        s.nombre AS servicio_nombre,
        s.profesional_id,
        (
          SELECT h.negocio_id
          FROM reserva_slot rs
          INNER JOIN slot sl
            ON sl.id = rs.slot_id
          INNER JOIN horario_profesional hp
            ON hp.id = sl.horario_profesional_id
          INNER JOIN horario h
            ON h.id = hp.horario_id
          WHERE rs.reserva_id = r.id
          ORDER BY rs.id
          LIMIT 1
        ) AS negocio_id
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

      return {
        reserva: null,
        notificaciones: [],
        cliente_id: null,
      };
    }

    const reserva = reservaResult.rows[0];
    clienteId = reserva.cliente_id;

    // ========================================================
    // EVITAR OPERACIONES SIMULTÁNEAS DUPLICADAS
    // ========================================================

    await client.query(
      "SELECT pg_advisory_xact_lock($1::integer, $2::integer)",
      [74102, clienteId],
    );

    // ========================================================
    // ACTUALIZAR ESTADO DE LA RESERVA
    // ========================================================

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

    // ========================================================
    // SINCRONIZAR RELACIONES RESERVA-SLOT
    // ========================================================
    //
    // COMPLETADA:
    // Conservamos las relaciones para que las consultas
    // puedan recuperar la reserva atendida.
    //
    // CANCELADA / NO_ASISTIO:
    // Liberamos la relación para permitir una nueva reserva.
    //
    // PENDIENTE / CONFIRMADA:
    // Mantenemos activas las relaciones.
    // ========================================================

    const estadosQueLiberan = ["CANCELADA", "NO_ASISTIO"];

    const estadosQueMantienenSlots = ["PENDIENTE", "CONFIRMADA", "COMPLETADA"];

    if (estadosQueLiberan.includes(estado)) {
      await client.query(
        `
        UPDATE reserva_slot
        SET activo = FALSE
        WHERE reserva_id = $1
          AND activo = TRUE
        `,
        [reservaId],
      );
    } else if (estadosQueMantienenSlots.includes(estado)) {
      await client.query(
        `
        UPDATE reserva_slot
        SET activo = TRUE
        WHERE reserva_id = $1
          AND activo = FALSE
        `,
        [reservaId],
      );
    }

    // ========================================================
    // MARCAR COMO LEÍDAS LAS NOTIFICACIONES DE LA RESERVA
    // ========================================================

    if (
      estado === "COMPLETADA" ||
      estado === "CANCELADA" ||
      estado === "NO_ASISTIO"
    ) {
      await client.query(
        `
        UPDATE notificacion
        SET
          estado = 'LEIDA',
          fecha_lectura = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE profesional_id = $1
          AND reserva_id = $2
          AND tipo = 'RESERVA'
          AND estado = 'NO_LEIDA'
        `,
        [profesionalId, reservaId],
      );
    }

    // ========================================================
    // GENERAR NOTIFICACIONES DE EVALUACIÓN
    // CUANDO LA RESERVA SE COMPLETA
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
          AND tc.estado = 'ACTIVO'
          AND tc.objetivo IN (
            'PIA',
            'PROFESIONAL',
            'NEGOCIO',
            'SERVICIO'
          )
        ORDER BY e.id;
      `;

      const { rows: evaluaciones } = await client.query(evaluacionesQuery);

      for (const evaluacion of evaluaciones) {
        // No invitar si este criterio ya fue calificado.
        const calificacionResult = await client.query(
          `
          SELECT 1
          FROM calificacion
          WHERE reserva_id = $1
            AND evaluacion_id = $2
          LIMIT 1
          `,
          [reservaId, evaluacion.evaluacion_id],
        );

        if (calificacionResult.rows.length) continue;

        // ====================================================
        // COMPROBAR SI YA EXISTE LA INVITACIÓN
        // ====================================================

        let duplicadaQuery;
        let duplicadaValues;

        switch (evaluacion.objetivo) {
          case "PIA":
            duplicadaQuery = `
              SELECT 1
              FROM notificacion
              WHERE cliente_id = $1
                AND evaluacion_id = $2
                AND tipo = 'EVALUACION_PENDIENTE'
              LIMIT 1
            `;

            duplicadaValues = [clienteId, evaluacion.evaluacion_id];
            break;

          case "PROFESIONAL":
            duplicadaQuery = `
              SELECT 1
              FROM notificacion
              WHERE cliente_id = $1
                AND profesional_id = $2
                AND evaluacion_id = $3
                AND tipo = 'EVALUACION_PENDIENTE'
              LIMIT 1
            `;

            duplicadaValues = [
              clienteId,
              reserva.profesional_id,
              evaluacion.evaluacion_id,
            ];
            break;

          case "NEGOCIO":
            if (!reserva.negocio_id) continue;

            duplicadaQuery = `
              SELECT 1
              FROM notificacion
              WHERE cliente_id = $1
                AND negocio_id = $2
                AND evaluacion_id = $3
                AND tipo = 'EVALUACION_PENDIENTE'
              LIMIT 1
            `;

            duplicadaValues = [
              clienteId,
              reserva.negocio_id,
              evaluacion.evaluacion_id,
            ];
            break;

          case "SERVICIO":
            duplicadaQuery = `
              SELECT 1
              FROM notificacion
              WHERE cliente_id = $1
                AND servicio_id = $2
                AND evaluacion_id = $3
                AND tipo = 'EVALUACION_PENDIENTE'
              LIMIT 1
            `;

            duplicadaValues = [
              clienteId,
              reserva.servicio_id,
              evaluacion.evaluacion_id,
            ];
            break;

          default:
            continue;
        }

        const duplicadaResult = await client.query(
          duplicadaQuery,
          duplicadaValues,
        );

        if (duplicadaResult.rows.length) continue;

        // ====================================================
        // PREPARAR NOTIFICACIÓN
        // ====================================================

        const nombreCriterio =
          evaluacion.tipo_nombre || evaluacion.codigo || evaluacion.objetivo;

        const datosNotificacion = {
          cliente_id: clienteId,
          reserva_id: reservaId,
          evaluacion_id: evaluacion.evaluacion_id,
          titulo: "¡Cuéntanos tu experiencia!",
          mensaje: `Tu reserva del servicio "${reserva.servicio_nombre}" ha sido completada. Puedes calificar: ${nombreCriterio}.`,
          tipo: "EVALUACION_PENDIENTE",
        };

        if (evaluacion.objetivo === "PROFESIONAL") {
          datosNotificacion.profesional_id = reserva.profesional_id;
        } else if (evaluacion.objetivo === "NEGOCIO") {
          datosNotificacion.negocio_id = reserva.negocio_id;
        } else if (evaluacion.objetivo === "SERVICIO") {
          datosNotificacion.servicio_id = reserva.servicio_id;
        }

        // ====================================================
        // INSERTAR NOTIFICACIÓN
        // ====================================================

        const insertNotificacionQuery = `
          INSERT INTO notificacion (
            cliente_id,
            profesional_id,
            negocio_id,
            reserva_id,
            evaluacion_id,
            servicio_id,
            titulo,
            mensaje,
            tipo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;

        const insertValues = [
          datosNotificacion.cliente_id,
          datosNotificacion.profesional_id || null,
          datosNotificacion.negocio_id || null,
          datosNotificacion.reserva_id,
          datosNotificacion.evaluacion_id,
          datosNotificacion.servicio_id || null,
          datosNotificacion.titulo,
          datosNotificacion.mensaje,
          datosNotificacion.tipo,
        ];

        const insertResult = await client.query(
          insertNotificacionQuery,
          insertValues,
        );

        if (insertResult.rows[0]) {
          notificacionesCreadas.push(insertResult.rows[0]);
        }
      }
    }

    // ========================================================
    // CONFIRMAR TRANSACCIÓN
    // ========================================================

    await client.query("COMMIT");
    transaccionIniciada = false;

    return {
      reserva: reservaActualizada,
      notificaciones: notificacionesCreadas,
      cliente_id: clienteId,
    };
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
