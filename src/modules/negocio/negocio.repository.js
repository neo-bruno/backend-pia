const pool = require("../../database/pool");

const getBusiness = async () => {
  const query = `
        SELECT
            id,
            nombre,
            descripcion
        FROM negocio
        ORDER BY nombre ASC
    `;
  const { rows } = await pool.query(query);
  return rows;
};

/******************************************************
 * REGISTRAR EL NEGOCIO Y PROEFSIONAL
 ******************************************************/

async function existsCodigoNegocio(client, codigo) {
  const query = `
    SELECT 1
    FROM negocio
    WHERE codigo = $1
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [codigo]);

  return rows.length > 0;
}

const generarNumeroPago = () => {
  const fecha = new Date();

  const parteFecha =
    fecha.getFullYear().toString() +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    String(fecha.getDate()).padStart(2, "0");

  const parteAleatoria = Math.floor(100000 + Math.random() * 900000);

  return `MEM-${parteFecha}-${parteAleatoria}`;
};

const slugify = (texto) => {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// =====================================================
// TIPOS
// =====================================================

async function getTipoNegocioById(client, id) {
  const result = await client.query(
    `
        SELECT id, nombre, descripcion, activo
        FROM tipo_negocio
        WHERE id = $1
        `,
    [id],
  );

  return result.rows[0] || null;
}

async function createTipoNegocio(client, datos) {
  const result = await client.query(
    `
        INSERT INTO tipo_negocio (
            nombre,
            descripcion
        )
        VALUES ($1, $2)
        RETURNING id, nombre, descripcion, activo
        `,
    [datos.nombre, datos.descripcion || null],
  );

  return result.rows[0];
}

async function getTipoProfesionalById(client, id) {
  const result = await client.query(
    `
        SELECT id, nombre, descripcion, activo
        FROM tipo_profesional
        WHERE id = $1
        `,
    [id],
  );

  return result.rows[0] || null;
}

async function createTipoProfesional(client, datos) {
  const result = await client.query(
    `
        INSERT INTO tipo_profesional (
            nombre,
            descripcion
        )
        VALUES ($1, $2)
        RETURNING id, nombre, descripcion, activo
        `,
    [datos.nombre, datos.descripcion || null],
  );

  return result.rows[0];
}

// =====================================================
// ROL
// =====================================================

async function getRolAdmin(client) {
  const result = await client.query(
    `
        SELECT id, nombre
        FROM rol
        WHERE UPPER(nombre) = 'ADMIN'
        LIMIT 1
        `,
  );

  return result.rows[0] || null;
}

// =====================================================
// METODO DE PAGO QR
// =====================================================

async function getMetodoPagoQR(client) {
  const result = await client.query(
    `
        SELECT
            id,
            nombre,
            codigo,
            estado
        FROM metodo_pago
        WHERE UPPER(codigo) = 'QR'
          AND estado = 'ACTIVO'
        LIMIT 1
        `,
  );

  return result.rows[0] || null;
}

// =====================================================
// SLUG
// =====================================================

async function existsSlug(client, slug) {
  const result = await client.query(
    `
        SELECT id
        FROM negocio
        WHERE slug = $1
        LIMIT 1
        `,
    [slug],
  );

  return result.rows.length > 0;
}

// =====================================================
// PERSONA
// =====================================================

async function createPersona(client, profesional) {
  const nombreCompleto =
    `${profesional.nombres} ${profesional.apellidos}`.trim();

  const result = await client.query(
    `
        INSERT INTO persona (
            nombre,
            telefono,
            sexo,
            fecha_nacimiento
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, nombre, telefono, sexo, fecha_nacimiento
        `,
    [
      nombreCompleto,
      profesional.telefono,
      profesional.sexo,
      profesional.fecha_nacimiento || null,
    ],
  );

  return result.rows[0];
}

// =====================================================
// PROFESIONAL
// =====================================================
const existsSlugProfesional = async (client, slug) => {
  const query = `
    SELECT 1
    FROM profesional
    WHERE slug = $1
    LIMIT 1
  `;

  const { rows } = await client.query(query, [slug]);

  return rows.length > 0;
};

async function createProfesional(client, personaId, slug) {
  const result = await client.query(
    `
        INSERT INTO profesional (
            persona_id,
            slug,
            estado,
            estado_funciones
        )
        VALUES (
            $1,
            $2,
            'ACTIVO',
            'DESHABILITADO'
        )
        RETURNING id, persona_id, estado, estado_funciones
        `,
    [personaId, slug],
  );

  return result.rows[0];
}

// =====================================================
// USUARIO
// =====================================================

async function createUsuario(client, personaId, rolId, telefono, password) {
  const result = await client.query(
    `
        INSERT INTO usuario (
            persona_id,
            rol_id,
            telefono,
            password,
            estado
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            'HABILITADO'
        )
        RETURNING id, persona_id, rol_id, telefono, estado
        `,
    [personaId, rolId, telefono, password],
  );

  return result.rows[0];
}

// =====================================================
// NEGOCIO
// =====================================================
async function createNegocio(client, negocio, slug, codigo) {
  const query = `
    INSERT INTO negocio (
      tipo_negocio_id,
      slug,
      codigo,
      nombre,
      descripcion,
      telefono,
      departamento,
      municipio,
      zona,
      direccion,
      latitud,
      longitud,
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
    RETURNING *;
  `;

  const values = [
    negocio.tipo_negocio_id,
    slug,
    codigo,
    negocio.nombre,
    negocio.descripcion || null,
    negocio.telefono || null,
    negocio.departamento,
    negocio.municipio || null,
    negocio.zona || null,
    negocio.direccion || null,
    negocio.latitud || null,
    negocio.longitud || null,
    "DESHABILITADO",
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

// =====================================================
// PROFESIONAL - NEGOCIO
// =====================================================

async function createProfesionalNegocio(client, negocioId, profesionalId) {
  const result = await client.query(
    `
        INSERT INTO profesional_negocio (
            negocio_id,
            profesional_id,
            acceso,
            estado
        )
        VALUES (
            $1,
            $2,
            'ACEPTADO',
            'DESHABILITADO'
        )
        RETURNING
            id,
            negocio_id,
            profesional_id,
            acceso,
            estado,
            fecha_creacion
        `,
    [negocioId, profesionalId],
  );

  return result.rows[0];
}

// =====================================================
// PROFESIONAL - TIPO PROFESIONAL
// =====================================================

async function createProfesionalTipo(client, profesionalId, tipoProfesionalId) {
  const result = await client.query(
    `
        INSERT INTO profesional_tipo_profesional (
            profesional_id,
            tipo_profesional_id
        )
        VALUES ($1, $2)
        RETURNING *
        `,
    [profesionalId, tipoProfesionalId],
  );

  return result.rows[0];
}

// =====================================================
// MEMBRESIA
// =====================================================

async function createMembresia(client, profesionalNegocioId, membresia) {
  const result = await client.query(
    `
        INSERT INTO membresia (
            profesional_negocio_id,
            fecha_inicio,
            fecha_fin,
            monto,
            estado_pagado,
            estado
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            FALSE,
            'ACTIVO'
        )
        RETURNING *
        `,
    [
      profesionalNegocioId,
      membresia.fecha_inicio,
      membresia.fecha_fin,
      membresia.monto,
    ],
  );

  return result.rows[0];
}

// =====================================================
// ARCHIVO
// =====================================================

async function createArchivo(client, file) {
  const url = `/uploads/gerencia/${file.filename}`;

  const result = await client.query(
    `
        INSERT INTO archivo (
            nombre,
            url,
            tipo,
            mime_type,
            tamano_bytes
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
    [file.originalname, url, "COMPROBANTE", file.mimetype, file.size],
  );

  return result.rows[0];
}

// =====================================================
// PAGO
// =====================================================

async function createPago(
  client,
  metodoPagoId,
  profesionalId,
  membresiaId,
  monto,
) {
  const numero = generarNumeroPago();

  const result = await client.query(
    `
        INSERT INTO pago (
            metodo_pago_id,
            profesional_id,
            membresia_id,
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
            CURRENT_DATE,
            CURRENT_TIME,
            $5,
            'ACTIVO'
        )
        RETURNING *
        `,
    [metodoPagoId, profesionalId, membresiaId, numero, monto],
  );

  return result.rows[0];
}

// =====================================================
// GERENCIA
// =====================================================
async function getGerenciaActiva(client) {
  const query = `
    SELECT
      id,
      gerente_id,
      nombre,
      direccion,
      monto_qr,
      estado
    FROM gerencia
    WHERE estado = 'ACTIVO'
    ORDER BY id
    LIMIT 1;
  `;

  const { rows } = await client.query(query);

  return rows[0] || null;
}

// =====================================================
// COMPROBANTE
// =====================================================

async function createComprobante(client, pagoId, archivoId, gerenciaId) {
  const query = `
    INSERT INTO comprobante (
      pago_id,
      archivo_id,
      validado_por_gerencia_id
    )
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [pagoId, archivoId, gerenciaId];

  const { rows } = await client.query(query, values);

  return rows[0];
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  slugify,

  getTipoNegocioById,
  createTipoNegocio,

  getTipoProfesionalById,
  createTipoProfesional,

  getGerenciaActiva,

  getRolAdmin,
  getMetodoPagoQR,

  existsSlug,

  createPersona,
  createProfesional,
  createUsuario,

  createNegocio,
  createProfesionalNegocio,
  createProfesionalTipo,

  createMembresia,
  createArchivo,
  createPago,
  createComprobante,

  getBusiness,

  existsCodigoNegocio,
  existsSlugProfesional
};
