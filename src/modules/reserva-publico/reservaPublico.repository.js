// =====================================================
// reservaPublico.repository.js
// =====================================================

const generarNumeroPago = () => {
  const fecha = new Date();

  const parteFecha =
    fecha.getFullYear().toString() +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    String(fecha.getDate()).padStart(2, "0");

  const parteAleatoria = Math.floor(100000 + Math.random() * 900000);

  return `RES-${parteFecha}-${parteAleatoria}`;
};

// =====================================================
// CLIENTE POR TOKEN
// =====================================================

async function getClienteByToken(client, token) {
  const query = `
    SELECT
      c.id,
      c.persona_id,
      c.alias,
      c.telefono,
      per.nombre
    FROM cliente c

    INNER JOIN persona per
      ON per.id = c.persona_id

    WHERE c.token = $1

    LIMIT 1
  `;

  const { rows } = await client.query(query, [token]);

  return rows[0] || null;
}

// =====================================================
// SERVICIO + PROFESIONAL + CONDICION
// =====================================================

async function getServicioReserva(client, servicioId) {
  const query = `
  SELECT

    /* SERVICIO */

    s.id AS servicio_id,
    s.profesional_id,
    s.nombre AS servicio_nombre,
    s.descripcion AS servicio_descripcion,
    s.duracion AS servicio_duracion,
    s.precio AS servicio_precio,
    s.estado AS servicio_estado,

    /* IMAGEN DEL SERVICIO */

    a.id AS servicio_archivo_id,
    a.nombre AS servicio_imagen_nombre,
    a.url AS servicio_imagen_url,
    a.mime_type AS servicio_imagen_mime_type,

    /* PROFESIONAL */

    p.id AS profesional_id_real,
    p.slug AS profesional_slug,
    p.foto AS profesional_foto,
    p.pago_qr AS profesional_pago_qr,
    per.nombre AS profesional_nombre,

    /* CONDICION */

    c.id AS condicion_id,
    c.nombre AS condicion_nombre,
    c.descripcion AS condicion_descripcion,
    c.requiere_adelanto,
    c.monto_adelanto,
    c.porcentaje_adelanto,
    c.permite_reprogramar,
    c.permite_cancelar,
    c.limite_horas_reprogramacion,
    c.limite_horas_cancelacion

  FROM servicio s

  INNER JOIN profesional p
    ON p.id = s.profesional_id

  INNER JOIN persona per
    ON per.id = p.persona_id

  LEFT JOIN servicio_archivo sa
    ON sa.servicio_id = s.id
    AND sa.principal = TRUE

  LEFT JOIN archivo a
    ON a.id = sa.archivo_id

  LEFT JOIN servicio_condicion sc
    ON sc.servicio_id = s.id

  LEFT JOIN condicion c
    ON c.id = sc.condicion_id

  WHERE s.id = $1
    AND s.estado = 'HABILITADO'
    AND p.estado = 'ACTIVO'
    AND p.estado_funciones = 'HABILITADO'

  LIMIT 1
`;

  const { rows } = await client.query(query, [servicioId]);

  if (!rows.length) {
    return null;
  }

  const row = rows[0];

  return {
    servicio: {
      id: Number(row.servicio_id),
      profesional_id: Number(row.profesional_id),
      nombre: row.servicio_nombre,
      descripcion: row.servicio_descripcion,
      duracion: Number(row.servicio_duracion),
      precio: Number(row.servicio_precio),
      estado: row.servicio_estado,

      imagen: row.servicio_imagen_url
        ? {
            id: Number(row.servicio_archivo_id),
            nombre: row.servicio_imagen_nombre,
            url: row.servicio_imagen_url,
            mime_type: row.servicio_imagen_mime_type,
          }
        : null,
    },

    profesional: {
      id: Number(row.profesional_id_real),
      nombre: row.profesional_nombre,
      slug: row.profesional_slug,
      foto: row.profesional_foto,
      pago_qr: row.profesional_pago_qr,
    },

    condicion: row.condicion_id
      ? {
          id: Number(row.condicion_id),
          nombre: row.condicion_nombre,
          descripcion: row.condicion_descripcion,
          requiere_adelanto: row.requiere_adelanto,
          monto_adelanto:
            row.monto_adelanto !== null ? Number(row.monto_adelanto) : null,
          porcentaje_adelanto:
            row.porcentaje_adelanto !== null
              ? Number(row.porcentaje_adelanto)
              : null,
          permite_reprogramar: row.permite_reprogramar,
          permite_cancelar: row.permite_cancelar,
          limite_horas_reprogramacion: row.limite_horas_reprogramacion,
          limite_horas_cancelacion: row.limite_horas_cancelacion,
        }
      : null,
  };
}

// =====================================================
// SLOTS
// =====================================================

async function getSlotsForReservation(client, slotIds, profesionalId, fecha) {
  const query = `
    SELECT

      s.id AS slot_id,
      s.hora_inicio,
      s.hora_fin,
      s.duracion,
      s.estado AS slot_estado,

      hp.id AS horario_profesional_id,
      hp.profesional_id,

      h.id AS horario_id,
      h.dia_semana,
      h.hora_inicio AS horario_inicio,
      h.hora_fin AS horario_fin,

      EXISTS (
        SELECT 1
        FROM reserva_slot rs
        INNER JOIN reserva r
          ON r.id = rs.reserva_id
        WHERE rs.slot_id = s.id
          AND rs.activo = TRUE
          AND r.estado IN ('PENDIENTE', 'CONFIRMADA')
      ) AS reservado

    FROM slot s

    INNER JOIN horario_profesional hp
      ON hp.id = s.horario_profesional_id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    WHERE s.id = ANY($1::INTEGER[])

      AND hp.profesional_id = $2

      AND h.dia_semana =
        EXTRACT(
          ISODOW FROM $3::DATE
        )::INTEGER

    ORDER BY
      s.hora_inicio ASC

    FOR UPDATE OF s
  `;

  const { rows } = await client.query(query, [slotIds, profesionalId, fecha]);

  return rows;
}

// =====================================================
// NUMERO DE RESERVA
// =====================================================

async function generarNumeroReserva(client) {
  /*
   * Bloqueamos la generación del número durante
   * la transacción para evitar duplicados.
   */

  await client.query(`
    SELECT pg_advisory_xact_lock(847215)
  `);

  const result = await client.query(`
    SELECT
      COALESCE(MAX(numero), 0) + 1 AS numero
    FROM reserva
  `);

  return Number(result.rows[0].numero);
}

// =====================================================
// RESERVA
// =====================================================

async function createReserva(client, datos) {
  const query = `
    INSERT INTO reserva (
      cliente_id,
      servicio_id,
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
      estado
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13
    )
    RETURNING *
  `;

  const values = [
    datos.cliente_id,
    datos.servicio_id,
    datos.numero,
    datos.fecha,
    datos.hora_inicio,
    datos.hora_fin,
    datos.precio_original,
    datos.monto_promocion,
    datos.monto_descuento,
    datos.precio_aplicable,
    datos.monto_pagado,
    datos.saldo,
    datos.estado,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

// =====================================================
// RESERVA SLOT
// =====================================================

async function createReservaSlot(client, reservaId, slotId, orden) {
  const query = `
    INSERT INTO reserva_slot (
      reserva_id,
      slot_id,
      orden,
      activo
    )
    VALUES ($1, $2, $3, TRUE)
    RETURNING *
  `;

  const { rows } = await client.query(query, [reservaId, slotId, orden]);

  return rows[0];
}

// =====================================================
// HISTORIAL DE RESERVA
// =====================================================

async function createHistorialReserva(client, datos) {
  const query = `
    INSERT INTO historial (
      negocio_id,
      cliente_id,
      profesional_id,
      servicio_id,
      reserva_id,
      fecha
    )
    SELECT
      h.negocio_id,
      r.cliente_id,
      s.profesional_id,
      r.servicio_id,
      r.id,
      r.fecha

    FROM reserva r

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    INNER JOIN reserva_slot rs
      ON rs.reserva_id = r.id
      AND rs.activo = TRUE
      AND rs.orden = 1

    INNER JOIN slot sl
      ON sl.id = rs.slot_id

    INNER JOIN horario_profesional hp
      ON hp.id = sl.horario_profesional_id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    WHERE r.id = $1

    RETURNING
      id,
      negocio_id,
      cliente_id,
      profesional_id,
      servicio_id,
      reserva_id,
      fecha,
      created_at,
      updated_at
  `;

  const { rows } = await client.query(query, [datos.reserva_id]);

  if (!rows.length) {
    throw new Error(
      "No se pudo crear el historial de la reserva porque no se pudo determinar el negocio.",
    );
  }

  return rows[0];
}

const ocuparSlots = async (client, slotsIds) => {
  if (!Array.isArray(slotsIds) || slotsIds.length === 0) {
    throw new Error("No existen slots para ocupar.");
  }

  const query = `
    UPDATE slot
    SET estado = 'OCUPADO'
    WHERE id = ANY($1::int[])
  `;

  await client.query(query, [slotsIds]);
};

// =====================================================
// METODO DE PAGO QR
// =====================================================

async function getMetodoPagoQR(client) {
  const query = `
    SELECT
      id,
      nombre,
      codigo
    FROM metodo_pago

    WHERE estado = 'ACTIVO'

      AND (
        UPPER(codigo) = 'QR'
        OR UPPER(nombre) LIKE '%QR%'
      )

    ORDER BY id

    LIMIT 1
  `;

  const { rows } = await client.query(query);

  return rows[0] || null;
}

// =====================================================
// ARCHIVO
// =====================================================

async function createArchivo(client, file) {
  const url = `/uploads/comprobantes/${file.filename}`;

  const query = `
    INSERT INTO archivo (
      nombre,
      url,
      tipo,
      mime_type,
      tamano_bytes
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING *
  `;

  const values = [
    file.originalname,
    url,
    "COMPROBANTE",
    file.mimetype,
    file.size,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

// =====================================================
// PAGO
// =====================================================

async function createPago(client, datos) {
  const numero = generarNumeroPago();

  const query = `
    INSERT INTO pago (
      metodo_pago_id,
      cliente_id,
      reserva_id,
      profesional_id,
      numero,
      fecha,
      hora,
      monto,
      estado
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      CURRENT_DATE,
      CURRENT_TIME,
      $6,
      'ACTIVO'
    )
    RETURNING *
  `;

  const values = [
    datos.metodo_pago_id,
    datos.cliente_id,
    datos.reserva_id,
    datos.profesional_id,
    numero,
    datos.monto,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

// =====================================================
// COMPROBANTE
// =====================================================

async function createComprobante(client, pagoId, archivoId) {
  const query = `
    INSERT INTO comprobante (
      pago_id,
      archivo_id,
      estado
    )
    VALUES (
      $1,
      $2,
      'PENDIENTE'
    )
    RETURNING *
  `;

  const { rows } = await client.query(query, [pagoId, archivoId]);

  return rows[0];
}

// =====================================================
// RESERVA COMPLETA
// =====================================================

async function getReservaCompleta(client, reservaId) {
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

      /* CLIENTE */

      c.id AS cliente_id,
      c.alias AS cliente_alias,
      perc.nombre AS cliente_nombre,
      c.telefono AS cliente_telefono,

      /* SERVICIO */

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      /* PROFESIONAL */

      p.id AS profesional_id,
      pp.nombre AS profesional_nombre,
      p.slug AS profesional_slug,
      p.foto AS profesional_foto,
      p.pago_qr AS profesional_pago_qr,

      /* NEGOCIO */

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.direccion AS negocio_direccion,
      n.telefono AS negocio_telefono,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada

    FROM reserva r

    INNER JOIN cliente c
      ON c.id = r.cliente_id

    INNER JOIN persona perc
      ON perc.id = c.persona_id

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    INNER JOIN profesional p
      ON p.id = s.profesional_id

    INNER JOIN persona pp
      ON pp.id = p.persona_id

    /* RESERVA → SLOTS */

    INNER JOIN reserva_slot rs
      ON rs.reserva_id = r.id
      AND rs.activo = TRUE
      AND rs.orden = 1

    /* SLOT → HORARIO_PROFESIONAL */

    INNER JOIN slot sl
      ON sl.id = rs.slot_id

    INNER JOIN horario_profesional hp
      ON hp.id = sl.horario_profesional_id

    /* HORARIO_PROFESIONAL → HORARIO */

    INNER JOIN horario h
      ON h.id = hp.horario_id

    /* HORARIO → NEGOCIO */

    INNER JOIN negocio n
      ON n.id = h.negocio_id

    WHERE r.id = $1

    LIMIT 1
  `;

  const { rows } = await client.query(query, [reservaId]);

  if (!rows.length) {
    return null;
  }

  const row = rows[0];

  return {
    id: Number(row.id),
    numero: Number(row.numero),

    fecha: row.fecha,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,

    precio_original: Number(row.precio_original),
    monto_promocion: Number(row.monto_promocion),
    monto_descuento: Number(row.monto_descuento),
    precio_aplicable: Number(row.precio_aplicable),
    monto_pagado: Number(row.monto_pagado),
    saldo: Number(row.saldo),

    estado: row.estado,

    /* CLIENTE */

    cliente: {
      id: Number(row.cliente_id),
      alias: row.cliente_alias,
      nombre: row.cliente_nombre,
      telefono: row.cliente_telefono,
    },

    /* SERVICIO */

    servicio: {
      id: Number(row.servicio_id),
      nombre: row.servicio_nombre,
      descripcion: row.servicio_descripcion,
      duracion: Number(row.servicio_duracion),
      precio: Number(row.servicio_precio),
    },

    /* PROFESIONAL */

    profesional: {
      id: Number(row.profesional_id),
      nombre: row.profesional_nombre,
      slug: row.profesional_slug,
      foto: row.profesional_foto,
      pago_qr: row.profesional_pago_qr,
    },

    /* NEGOCIO */

    negocio: {
      id: Number(row.negocio_id),
      nombre: row.negocio_nombre,
      direccion: row.negocio_direccion,
      telefono: row.negocio_telefono,
      logo: row.negocio_logo,
      portada: row.negocio_portada,
    },
  };
}

// =====================================================
// RESERVAS DEL CLIENTE
// =====================================================

async function getReservationsByCliente(client, clienteId) {
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

      -- =============================================
      -- SERVICIO
      -- =============================================

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      -- =============================================
      -- PROFESIONAL
      -- =============================================

      p.id AS profesional_id,
      p.slug AS profesional_slug,
      p.foto AS profesional_foto,

      per.nombre AS profesional_nombre,

      -- =============================================
      -- NEGOCIO
      -- =============================================

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.direccion AS negocio_direccion,
      n.telefono AS negocio_telefono,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada,

      -- =============================================
      -- CANTIDAD DE SLOTS
      -- =============================================

      (
        SELECT COUNT(*)
        FROM reserva_slot rs2
        WHERE rs2.reserva_id = r.id
          AND rs2.activo = TRUE
      ) AS cantidad_slots

    FROM reserva r

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    INNER JOIN profesional p
      ON p.id = s.profesional_id

    INNER JOIN persona per
      ON per.id = p.persona_id

    INNER JOIN reserva_slot rs
      ON rs.reserva_id = r.id
      AND rs.activo = TRUE
      AND rs.orden = 1

    INNER JOIN slot sl
      ON sl.id = rs.slot_id

    INNER JOIN horario_profesional hp
      ON hp.id = sl.horario_profesional_id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    INNER JOIN negocio n
      ON n.id = h.negocio_id

    WHERE r.cliente_id = $1

    ORDER BY
      r.fecha DESC,
      r.hora_inicio DESC,
      r.id DESC
  `;

  const { rows } = await client.query(query, [clienteId]);

  return rows.map((row) => ({
    id: Number(row.id),
    numero: Number(row.numero),

    fecha: row.fecha,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,

    precio_original: Number(row.precio_original),
    monto_promocion: Number(row.monto_promocion),
    monto_descuento: Number(row.monto_descuento),
    precio_aplicable: Number(row.precio_aplicable),
    monto_pagado: Number(row.monto_pagado),
    saldo: Number(row.saldo),

    estado: row.estado,

    servicio: {
      id: Number(row.servicio_id),
      nombre: row.servicio_nombre,
      descripcion: row.servicio_descripcion,
      duracion: Number(row.servicio_duracion),
      precio: Number(row.servicio_precio),
    },

    profesional: {
      id: Number(row.profesional_id),
      nombre: row.profesional_nombre,
      slug: row.profesional_slug,
      foto: row.profesional_foto,
    },

    negocio: {
      id: Number(row.negocio_id),
      nombre: row.negocio_nombre,
      direccion: row.negocio_direccion,
      telefono: row.negocio_telefono,
      logo: row.negocio_logo,
      portada: row.negocio_portada,
    },

    cantidad_slots: Number(row.cantidad_slots),
  }));
}

// =====================================================
// DETALLE RESERVA DEL CLIENTE
// =====================================================

async function getReservaCompletaCliente(client, reservaId, clienteId) {
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

      -- =============================================
      -- SERVICIO
      -- =============================================

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      -- =============================================
      -- PROFESIONAL
      -- =============================================

      p.id AS profesional_id,
      p.slug AS profesional_slug,
      p.foto AS profesional_foto,
      p.pago_qr AS profesional_pago_qr,

      per.nombre AS profesional_nombre,

      -- =============================================
      -- NEGOCIO
      -- =============================================

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.direccion AS negocio_direccion,
      n.telefono AS negocio_telefono,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada

    FROM reserva r

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    INNER JOIN profesional p
      ON p.id = s.profesional_id

    INNER JOIN persona per
      ON per.id = p.persona_id

    INNER JOIN reserva_slot rs
      ON rs.reserva_id = r.id
      AND rs.activo = TRUE
      AND rs.orden = 1

    INNER JOIN slot sl
      ON sl.id = rs.slot_id

    INNER JOIN horario_profesional hp
      ON hp.id = sl.horario_profesional_id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    INNER JOIN negocio n
      ON n.id = h.negocio_id

    WHERE r.id = $1
      AND r.cliente_id = $2

    LIMIT 1
  `;

  const { rows } = await client.query(query, [reservaId, clienteId]);

  if (!rows.length) {
    return null;
  }

  const row = rows[0];

  // =============================================
  // OBTENER TODOS LOS SLOTS
  // =============================================

  const slotsQuery = `
    SELECT
      sl.id,
      sl.hora_inicio,
      sl.hora_fin,
      sl.duracion,
      rs.orden

    FROM reserva_slot rs

    INNER JOIN slot sl
      ON sl.id = rs.slot_id

    WHERE rs.reserva_id = $1
      AND rs.activo = TRUE

    ORDER BY rs.orden ASC
  `;

  const slotsResult = await client.query(slotsQuery, [reservaId]);

  return {
    id: Number(row.id),
    numero: Number(row.numero),

    fecha: row.fecha,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,

    precio_original: Number(row.precio_original),
    monto_promocion: Number(row.monto_promocion),
    monto_descuento: Number(row.monto_descuento),
    precio_aplicable: Number(row.precio_aplicable),
    monto_pagado: Number(row.monto_pagado),
    saldo: Number(row.saldo),

    estado: row.estado,

    servicio: {
      id: Number(row.servicio_id),
      nombre: row.servicio_nombre,
      descripcion: row.servicio_descripcion,
      duracion: Number(row.servicio_duracion),
      precio: Number(row.servicio_precio),
    },

    profesional: {
      id: Number(row.profesional_id),
      nombre: row.profesional_nombre,
      slug: row.profesional_slug,
      foto: row.profesional_foto,
      pago_qr: row.profesional_pago_qr,
    },

    negocio: {
      id: Number(row.negocio_id),
      nombre: row.negocio_nombre,
      direccion: row.negocio_direccion,
      telefono: row.negocio_telefono,
      logo: row.negocio_logo,
      portada: row.negocio_portada,
    },

    slots: slotsResult.rows.map((slot) => ({
      id: Number(slot.id),
      hora_inicio: slot.hora_inicio,
      hora_fin: slot.hora_fin,
      duracion: Number(slot.duracion),
      orden: Number(slot.orden),
    })),
  };
}

module.exports = {
  getClienteByToken,
  getServicioReserva,
  getSlotsForReservation,
  generarNumeroReserva,
  createReserva,
  createHistorialReserva,
  createReservaSlot,
  getMetodoPagoQR,
  createArchivo,
  createPago,
  createComprobante,
  getReservaCompleta,

  ocuparSlots,

  // NUEVO
  getReservationsByCliente,
  getReservaCompletaCliente,
};
