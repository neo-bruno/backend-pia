BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PIA DATABASE - SCRIPT COMPLETO
-- 29 tablas / entidades cerradas durante el modelado.

CREATE TYPE estado_usuario_enum AS ENUM (
    'HABILITADO',
    'DESHABILITADO'
);
CREATE TYPE estado_profesional_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_funcion_profesional_enum AS ENUM (
    'HABILITADO',
    'DESHABILITADO'
);
CREATE TYPE acceso_profesional_negocio_enum AS ENUM (
    'ACEPTADO',
    'DENEGADO'
);
CREATE TYPE estado_profesional_negocio_enum AS ENUM (
    'HABILITADO',
    'DESHABILITADO'
);
CREATE TYPE estado_slot_enum AS ENUM (
    'DISPONIBLE',
    'OCUPADO',
    'BLOQUEADO'
);
CREATE TYPE estado_servicio_enum AS ENUM (
    'HABILITADO',
    'DESHABILITADO'
);
CREATE TYPE estado_tipo_promocion_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_promocion_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_descuento_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_reserva_enum AS ENUM (
    'CONFIRMADA',
    'CANCELADA',
    'NO_ASISTIO',
    'COMPLETADA'
);
CREATE TYPE estado_metodo_pago_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_membresia_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_pago_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_comprobante_enum AS ENUM (
    'PENDIENTE',
    'ACEPTADO',
    'RECHAZADO'
);
CREATE TYPE estado_segmentacion_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_tipo_calificacion_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_calificacion_enum AS ENUM (
    'ACTIVA',
    'INACTIVA'
);
CREATE TYPE tipo_ranking_enum AS ENUM (
    'NEGOCIO',
    'PLATAFORMA',
    'PROFESIONAL'
);
CREATE TYPE estado_ranking_enum AS ENUM (
    'ACTIVO',
    'INACTIVO'
);
CREATE TYPE estado_reclamo_enum AS ENUM (
    'PENDIENTE',
    'ATENDIDO',
    'CERRADO'
);
CREATE TYPE satisfaccion_reclamo_enum AS ENUM (
    'EXCELENTE',
    'MUY_BUENO',
    'BUENO',
    'MALO',
    'PESIMO'
);
CREATE TYPE estado_notificacion_enum AS ENUM (
    'LEIDA',
    'NO_LEIDA'
);

CREATE TABLE rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL
);

CREATE TABLE persona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    sexo VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE negocio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(150) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    telefono VARCHAR(30),
    direccion TEXT,
    latitud NUMERIC(10,7),
    longitud NUMERIC(10,7),
    logo TEXT,
    portada TEXT,
    color_1 VARCHAR(20),
    color_2 VARCHAR(20),
    color_3 VARCHAR(20),
    estado VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES persona(id),
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE gerente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES persona(id),
    nombre VARCHAR(150) NOT NULL,
    estado VARCHAR(20) NOT NULL
);
CREATE TABLE tipo_profesional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocio(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES persona(id),
    rol_id UUID NOT NULL REFERENCES rol(id),
    telefono VARCHAR(30) NOT NULL,
    password TEXT NOT NULL,
    estado estado_usuario_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE profesional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES persona(id),
    tipo_profesional_id UUID NOT NULL REFERENCES tipo_profesional(id),
    estado estado_profesional_enum NOT NULL DEFAULT 'ACTIVO',
    estado_funciones estado_funcion_profesional_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE gerencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gerente_id UUID NOT NULL REFERENCES gerente(id),
    negocio_id UUID NOT NULL REFERENCES negocio(id),
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    estado VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE profesional_negocio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocio(id),
    profesional_id UUID NOT NULL REFERENCES profesional(id),
    acceso acceso_profesional_negocio_enum NOT NULL,
    estado estado_profesional_negocio_enum NOT NULL,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE TABLE horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocio(id),
    dia_semana INTEGER NOT NULL,
    turno INTEGER NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horario_horas CHECK (hora_fin > hora_inicio)
);
CREATE TABLE horario_profesional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_id UUID NOT NULL REFERENCES horario(id),
    profesional_id UUID NOT NULL REFERENCES profesional(id)
);
CREATE TABLE slot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_id UUID NOT NULL REFERENCES horario(id),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion INTEGER NOT NULL,
    estado estado_slot_enum NOT NULL DEFAULT 'DISPONIBLE'
);
CREATE TABLE condicion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    requiere_adelanto BOOLEAN NOT NULL DEFAULT FALSE,
    monto_adelanto NUMERIC(12,2),
    porcentaje_adelanto NUMERIC(5,2),
    permite_reprogramar BOOLEAN NOT NULL DEFAULT FALSE,
    permite_cancelar BOOLEAN NOT NULL DEFAULT FALSE,
    limite_horas_reprogramacion INTEGER,
    limite_horas_cancelacion INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesional_id UUID NOT NULL REFERENCES profesional(id),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    duracion INTEGER NOT NULL,
    precio NUMERIC(12,2) NOT NULL,
    estado estado_servicio_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE servicio_condicion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    condicion_id UUID NOT NULL REFERENCES condicion(id),
    UNIQUE (servicio_id, condicion_id)
);
CREATE TABLE tipo_promocion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado estado_tipo_promocion_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE promocion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_promocion_id UUID NOT NULL REFERENCES tipo_promocion(id),
    cliente_id UUID REFERENCES cliente(id),
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    fecha_inicio DATE NOT NULL,
    fecha_final DATE NOT NULL,
    descripcion TEXT,
    monto_descuento NUMERIC(12,2),
    porcentaje_descuento NUMERIC(5,2),
    limite_cortes INTEGER,
    fecha_especial DATE,
    fecha_cumpleanos DATE,
    estado estado_promocion_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_promocion_fechas CHECK (fecha_final >= fecha_inicio),
    CONSTRAINT chk_promocion_descuento_uno CHECK ((monto_descuento IS NOT NULL AND porcentaje_descuento IS NULL) OR (monto_descuento IS NULL AND porcentaje_descuento IS NOT NULL)),
    CONSTRAINT chk_promocion_monto CHECK (monto_descuento IS NULL OR monto_descuento >= 0),
    CONSTRAINT chk_promocion_porcentaje CHECK (porcentaje_descuento IS NULL OR porcentaje_descuento BETWEEN 0 AND 100)
);
CREATE TABLE descuento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    monto NUMERIC(12,2),
    porcentaje NUMERIC(5,2),
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado estado_descuento_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_descuento_fechas CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT chk_descuento_uno CHECK ((monto IS NOT NULL AND porcentaje IS NULL) OR (monto IS NULL AND porcentaje IS NOT NULL)),
    CONSTRAINT chk_descuento_monto CHECK (monto IS NULL OR monto >= 0),
    CONSTRAINT chk_descuento_porcentaje CHECK (porcentaje IS NULL OR porcentaje BETWEEN 0 AND 100)
);
CREATE TABLE reserva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES cliente(id),
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    slot_id UUID NOT NULL REFERENCES slot(id),
    numero VARCHAR(50) NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    precio_original NUMERIC(12,2) NOT NULL,
    monto_promocion NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
    precio_aplicable NUMERIC(12,2) NOT NULL,
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado estado_reserva_enum NOT NULL DEFAULT 'CONFIRMADA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reserva_horas CHECK (hora_fin > hora_inicio)
);
CREATE TABLE reprogramacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_original_id UUID NOT NULL REFERENCES reserva(id),
    reserva_nueva_id UUID NOT NULL REFERENCES reserva(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    CONSTRAINT chk_reprogramacion_reservas CHECK (reserva_original_id <> reserva_nueva_id)
);
CREATE TABLE metodo_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    afecta_efectivo BOOLEAN NOT NULL,
    estado estado_metodo_pago_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE membresia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesional_id UUID NOT NULL REFERENCES profesional(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    estado_pagado BOOLEAN NOT NULL DEFAULT FALSE,
    estado estado_membresia_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_membresia_fechas CHECK (fecha_fin >= fecha_inicio)
);
CREATE TABLE pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metodo_pago_id UUID NOT NULL REFERENCES metodo_pago(id),
    cliente_id UUID REFERENCES cliente(id),
    reserva_id UUID REFERENCES reserva(id),
    profesional_id UUID REFERENCES profesional(id),
    membresia_id UUID REFERENCES membresia(id),
    numero VARCHAR(50) NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    estado estado_pago_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE archivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE comprobante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id UUID NOT NULL REFERENCES pago(id),
    archivo_id UUID NOT NULL REFERENCES archivo(id),
    estado estado_comprobante_enum NOT NULL DEFAULT 'PENDIENTE',
    observacion TEXT,
    validado_por_profesional_id UUID REFERENCES profesional(id),
    validado_por_gerencia_id UUID REFERENCES gerencia(id),
    fecha_validacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE negocio_archivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocio(id),
    archivo_id UUID NOT NULL REFERENCES archivo(id),
    UNIQUE (negocio_id, archivo_id)
);
CREATE TABLE profesional_archivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesional_id UUID NOT NULL REFERENCES profesional(id),
    archivo_id UUID NOT NULL REFERENCES archivo(id),
    UNIQUE (profesional_id, archivo_id)
);
CREATE TABLE servicio_archivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    archivo_id UUID NOT NULL REFERENCES archivo(id),
    UNIQUE (servicio_id, archivo_id)
);
CREATE TABLE historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES cliente(id),
    profesional_id UUID NOT NULL REFERENCES profesional(id),
    servicio_id UUID NOT NULL REFERENCES servicio(id),
    reserva_id UUID REFERENCES reserva(id),
    fecha DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE segmentacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    min_atenciones INTEGER NOT NULL,
    periodo_dias INTEGER NOT NULL,
    max_intervalo_dias INTEGER NOT NULL,
    max_dias_ultima_atencion INTEGER NOT NULL,
    estado estado_segmentacion_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE historial_segmentacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historial_id UUID NOT NULL REFERENCES historial(id),
    segmentacion_id UUID NOT NULL REFERENCES segmentacion(id),
    UNIQUE (historial_id, segmentacion_id)
);
CREATE TABLE tipo_calificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado estado_tipo_calificacion_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE calificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    profesional_id UUID REFERENCES profesional(id),
    negocio_id UUID REFERENCES negocio(id),
    servicio_id UUID REFERENCES servicio(id),
    gerencia_id UUID REFERENCES gerencia(id),
    tipo_calificacion_id UUID NOT NULL REFERENCES tipo_calificacion(id),
    puntaje NUMERIC(5,2) NOT NULL,
    titulo VARCHAR(200),
    observacion TEXT,
    estado estado_calificacion_enum NOT NULL DEFAULT 'ACTIVA',
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ranking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo tipo_ranking_enum NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cantidad_minima_calificaciones INTEGER NOT NULL,
    estado estado_ranking_enum NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranking_id UUID NOT NULL REFERENCES ranking(id),
    cliente_id UUID REFERENCES cliente(id),
    profesional_id UUID REFERENCES profesional(id),
    negocio_id UUID REFERENCES negocio(id),
    servicio_id UUID REFERENCES servicio(id),
    gerencia_id UUID REFERENCES gerencia(id),
    tipo_calificacion_id UUID NOT NULL REFERENCES tipo_calificacion(id),
    puntaje_promedio NUMERIC(5,2) NOT NULL,
    cantidad_calificaciones INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ranking_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranking_id UUID NOT NULL REFERENCES ranking(id),
    evaluacion_id UUID NOT NULL REFERENCES evaluacion(id),
    profesional_id UUID REFERENCES profesional(id),
    negocio_id UUID REFERENCES negocio(id),
    servicio_id UUID REFERENCES servicio(id),
    gerencia_id UUID REFERENCES gerencia(id),
    posicion INTEGER NOT NULL,
    puntaje NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE reclamo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES cliente(id),
    profesional_id UUID REFERENCES profesional(id),
    negocio_id UUID REFERENCES negocio(id),
    servicio_id UUID REFERENCES servicio(id),
    gerencia_id UUID REFERENCES gerencia(id),
    estado estado_reclamo_enum NOT NULL DEFAULT 'PENDIENTE',
    texto TEXT NOT NULL,
    satisfaccion satisfaccion_reclamo_enum NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE notificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    profesional_id UUID REFERENCES profesional(id),
    gerente_id UUID REFERENCES gerente(id),
    gerencia_id UUID REFERENCES gerencia(id),
    reserva_id UUID REFERENCES reserva(id),
    pago_id UUID REFERENCES pago(id),
    membresia_id UUID REFERENCES membresia(id),
    reclamo_id UUID REFERENCES reclamo(id),
    promocion_id UUID REFERENCES promocion(id),
    descuento_id UUID REFERENCES descuento(id),
    servicio_id UUID REFERENCES servicio(id),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    estado estado_notificacion_enum NOT NULL DEFAULT 'NO_LEIDA',
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_lectura TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX idx_usuario_persona ON usuario(persona_id);
CREATE INDEX idx_usuario_rol ON usuario(rol_id);
CREATE INDEX idx_cliente_persona ON cliente(persona_id);
CREATE INDEX idx_profesional_persona ON profesional(persona_id);
CREATE INDEX idx_profesional_tipo ON profesional(tipo_profesional_id);
CREATE INDEX idx_gerencia_gerente ON gerencia(gerente_id);
CREATE INDEX idx_gerencia_negocio ON gerencia(negocio_id);
CREATE INDEX idx_horario_negocio ON horario(negocio_id);
CREATE INDEX idx_horario_profesional_horario ON horario_profesional(horario_id);
CREATE INDEX idx_horario_profesional_profesional ON horario_profesional(profesional_id);
CREATE INDEX idx_slot_horario ON slot(horario_id);
CREATE INDEX idx_servicio_profesional ON servicio(profesional_id);
CREATE INDEX idx_reserva_cliente ON reserva(cliente_id);
CREATE INDEX idx_reserva_servicio ON reserva(servicio_id);
CREATE INDEX idx_reserva_slot ON reserva(slot_id);
CREATE INDEX idx_pago_cliente ON pago(cliente_id);
CREATE INDEX idx_pago_reserva ON pago(reserva_id);
CREATE INDEX idx_pago_profesional ON pago(profesional_id);
CREATE INDEX idx_pago_membresia ON pago(membresia_id);
CREATE INDEX idx_comprobante_pago ON comprobante(pago_id);
CREATE INDEX idx_historial_cliente ON historial(cliente_id);
CREATE INDEX idx_historial_profesional ON historial(profesional_id);
CREATE INDEX idx_historial_servicio ON historial(servicio_id);
CREATE INDEX idx_calificacion_cliente ON calificacion(cliente_id);
CREATE INDEX idx_calificacion_profesional ON calificacion(profesional_id);
CREATE INDEX idx_calificacion_negocio ON calificacion(negocio_id);
CREATE INDEX idx_calificacion_servicio ON calificacion(servicio_id);
CREATE INDEX idx_calificacion_gerencia ON calificacion(gerencia_id);
CREATE INDEX idx_evaluacion_ranking ON evaluacion(ranking_id);
CREATE INDEX idx_ranking_detalle_ranking ON ranking_detalle(ranking_id);
CREATE INDEX idx_reclamo_cliente ON reclamo(cliente_id);
CREATE INDEX idx_reclamo_gerencia ON reclamo(gerencia_id);
CREATE INDEX idx_notificacion_cliente ON notificacion(cliente_id);
CREATE INDEX idx_notificacion_profesional ON notificacion(profesional_id);
CREATE INDEX idx_notificacion_gerente ON notificacion(gerente_id);
CREATE INDEX idx_notificacion_gerencia ON notificacion(gerencia_id);

COMMIT;
