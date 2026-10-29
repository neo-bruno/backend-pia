BEGIN;

-- PIA DATABASE - SCRIPT COMPLETO
-- 29 tablas / entidades cerradas durante el modelado.
-- IDs numéricos: SERIAL para PK e INTEGER para FK.

CREATE TYPE estado_usuario_enum AS ENUM ('HABILITADO','DESHABILITADO');
CREATE TYPE estado_profesional_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_funcion_profesional_enum AS ENUM ('HABILITADO','DESHABILITADO');
CREATE TYPE acceso_profesional_negocio_enum AS ENUM ('ACEPTADO','DENEGADO');
CREATE TYPE estado_profesional_negocio_enum AS ENUM ('HABILITADO','DESHABILITADO');
CREATE TYPE estado_slot_enum AS ENUM ('DISPONIBLE','OCUPADO','BLOQUEADO');
CREATE TYPE estado_servicio_enum AS ENUM ('HABILITADO','DESHABILITADO');
CREATE TYPE estado_tipo_promocion_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_promocion_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_descuento_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_reserva_enum AS ENUM ('PENDIENTE', 'CONFIRMADA','CANCELADA','NO_ASISTIO','COMPLETADA');
CREATE TYPE estado_metodo_pago_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_membresia_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_pago_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_comprobante_enum AS ENUM ('PENDIENTE','ACEPTADO','RECHAZADO');
CREATE TYPE estado_segmentacion_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_tipo_calificacion_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_calificacion_enum AS ENUM ('ACTIVA','INACTIVA');
CREATE TYPE tipo_ranking_enum AS ENUM ('NEGOCIO','PLATAFORMA','PROFESIONAL','SERVICIO');
CREATE TYPE estado_ranking_enum AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_reclamo_enum AS ENUM ('PENDIENTE','ATENDIDO','CERRADO');
CREATE TYPE satisfaccion_reclamo_enum AS ENUM ('EXCELENTE','MUY_BUENO','BUENO','MALO','PESIMO');
CREATE TYPE estado_notificacion_enum AS ENUM ('LEIDA','NO_LEIDA');
CREATE TYPE tipo_servicio_archivo_enum AS ENUM ('FOTO', 'VIDEO');
CREATE TYPE objetivo_calificacion_enum AS ENUM ('PROFESIONAL', 'SERVICIO', 'NEGOCIO', 'PIA');
CREATE TYPE estado_evaluacion_enum AS ENUM ('HABILITADO', 'DESHABILITADO');
CREATE TYPE tipo_descuento_enum AS ENUM ('CLIENTE', 'PUBLICO');
CREATE TYPE estado_negocio_enum AS ENUM ('HABILITADO', 'DESHABILITADO');

CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL
);

CREATE TABLE persona (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    sexo VARCHAR(20),
    fecha_nacimiento DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipo_negocio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE negocio (
    id SERIAL PRIMARY KEY,
    tipo_negocio_id INTEGER NOT NULL REFERENCES tipo_negocio(id),
    slug VARCHAR(250) NOT NULL UNIQUE,
		codigo VARCHAR(150) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    telefono VARCHAR(30),
    departamento VARCHAR(150) NOT NULL,
    municipio VARCHAR(150),
    zona VARCHAR(150),
    direccion TEXT,
    latitud NUMERIC(10,7),
    longitud NUMERIC(10,7),
    logo TEXT,
    portada TEXT,
    eslogan VARCHAR(250),
    informacion TEXT,
    recomendacion VARCHAR(250),
    estado estado_negocio_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER NOT NULL REFERENCES persona(id),

    alias VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL UNIQUE,

    token TEXT UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gerente (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER NOT NULL REFERENCES persona(id),
    nombre VARCHAR(150) NOT NULL,
    estado VARCHAR(20) NOT NULL
);

CREATE TABLE tipo_profesional (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER NOT NULL REFERENCES persona(id),
    rol_id INTEGER NOT NULL REFERENCES rol(id),
    telefono VARCHAR(30) NOT NULL,
    password TEXT NOT NULL,
    estado estado_usuario_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profesional (
    id SERIAL PRIMARY KEY,
		persona_id INTEGER NOT NULL UNIQUE REFERENCES persona(id),
		slug VARCHAR(250) NOT NULL UNIQUE,
		foto TEXT,
		portada TEXT,
		fecha_trabajo DATE,
		descripcion TEXT,
		lema VARCHAR(250),
		pago_qr TEXT,
    estado estado_profesional_enum NOT NULL DEFAULT 'ACTIVO',
    estado_funciones estado_funcion_profesional_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE archivo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gerencia (
    id SERIAL PRIMARY KEY,
    gerente_id INTEGER NOT NULL REFERENCES gerente(id),
    archivo_id INTEGER NOT NULL REFERENCES archivo(id),
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
		monto_qr INTEGER NOT NULL,
    estado VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profesional_negocio (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER NOT NULL REFERENCES negocio(id),
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),    
    acceso acceso_profesional_negocio_enum NOT NULL,
    estado estado_profesional_negocio_enum NOT NULL,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE		
);

CREATE TABLE horario (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER NOT NULL REFERENCES negocio(id),
    dia_semana INTEGER NOT NULL,
    turno INTEGER NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horario_horas CHECK (hora_fin > hora_inicio)
);

CREATE TABLE horario_profesional (
    id SERIAL PRIMARY KEY,
    horario_id INTEGER NOT NULL REFERENCES horario(id),
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),

    CONSTRAINT uq_horario_profesional
        UNIQUE (horario_id, profesional_id)
);

CREATE TABLE profesional_tipo_profesional (
    id SERIAL PRIMARY KEY,
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),
    tipo_profesional_id INTEGER NOT NULL REFERENCES tipo_profesional(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_profesional_tipo_profesional UNIQUE (profesional_id, tipo_profesional_id)
);

CREATE TABLE slot (
    id SERIAL PRIMARY KEY,
    horario_profesional_id INTEGER NOT NULL
        REFERENCES horario_profesional(id),

    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion INTEGER NOT NULL,

    estado estado_slot_enum NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT chk_slot_horas
        CHECK (hora_fin > hora_inicio),

    CONSTRAINT uq_slot_horario_profesional_hora
        UNIQUE (
            horario_profesional_id,
            hora_inicio,
            hora_fin
        )
);

CREATE TABLE condicion (
    id SERIAL PRIMARY KEY,
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
    id SERIAL PRIMARY KEY,
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    duracion INTEGER NOT NULL,
    precio NUMERIC(12,2) NOT NULL,
    estado estado_servicio_enum NOT NULL DEFAULT 'HABILITADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicio_condicion (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES servicio(id),
    condicion_id INTEGER NOT NULL REFERENCES condicion(id),
    UNIQUE (servicio_id, condicion_id)
);

CREATE TABLE tipo_promocion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado estado_tipo_promocion_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promocion (
    id SERIAL PRIMARY KEY,
    tipo_promocion_id INTEGER NOT NULL REFERENCES tipo_promocion(id),
    cliente_id INTEGER REFERENCES cliente(id),
    servicio_id INTEGER NOT NULL REFERENCES servicio(id),
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
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER NOT NULL REFERENCES negocio(id),
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),

    codigo VARCHAR(50) NOT NULL UNIQUE,		
		titulo VARCHAR(250),
		descripcion TEXT,
		
    monto NUMERIC(12,2),		
    porcentaje NUMERIC(5,2),    

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

CREATE TABLE descuento_servicio (
    id SERIAL PRIMARY KEY,

    servicio_id INTEGER NOT NULL REFERENCES servicio(id),
    descuento_id INTEGER NOT NULL REFERENCES descuento(id),

    tipo_descuento tipo_descuento_enum NOT NULL DEFAULT 'CLIENTE',
    estado estado_descuento_enum NOT NULL DEFAULT 'ACTIVO',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_descuento_servicio UNIQUE (servicio_id, descuento_id)
);


CREATE TABLE descuento_servicio_cliente (
    id SERIAL PRIMARY KEY,
		
    descuento_servicio_id INTEGER NOT NULL REFERENCES descuento_servicio(id),
    cliente_id INTEGER REFERENCES cliente(id),

    fecha_aplicada DATE DEFAULT CURRENT_DATE,
    hora_aplicada TIME DEFAULT CURRENT_TIME,

    codigo_aplicado VARCHAR(50),
    monto_aplicado NUMERIC(12,2),

    estado_asignacion estado_descuento_enum NOT NULL DEFAULT 'ACTIVO',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_descuento_aplicado_monto CHECK (monto_aplicado >= 0)
);

CREATE TABLE reserva (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id),
    servicio_id INTEGER NOT NULL REFERENCES servicio(id),
    numero BIGINT NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    precio_original NUMERIC(12,2) NOT NULL,
    monto_promocion NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
    precio_aplicable NUMERIC(12,2) NOT NULL,
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado estado_reserva_enum NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reserva_horas CHECK (hora_fin > hora_inicio)
);

CREATE TABLE reserva_slot (
    id SERIAL PRIMARY KEY,

    reserva_id INTEGER NULL
        REFERENCES reserva(id) ON DELETE CASCADE,

    slot_id INTEGER NOT NULL
        REFERENCES slot(id),

    bloqueo_id INTEGER NULL
        REFERENCES bloqueo(id) ON DELETE CASCADE,

    orden INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_reserva_slot
        UNIQUE (reserva_id, slot_id),

    CONSTRAINT chk_reserva_slot_orden
        CHECK (orden > 0),

    CONSTRAINT chk_reserva_slot_origen
        CHECK (
            (reserva_id IS NOT NULL AND bloqueo_id IS NULL)
            OR
            (reserva_id IS NULL AND bloqueo_id IS NOT NULL)
        )
);

CREATE TABLE reprogramacion (
    id SERIAL PRIMARY KEY,
    reserva_original_id INTEGER NOT NULL REFERENCES reserva(id),
    reserva_nueva_id INTEGER NOT NULL REFERENCES reserva(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    CONSTRAINT chk_reprogramacion_reservas CHECK (reserva_original_id <> reserva_nueva_id)
);

CREATE TABLE metodo_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    afecta_efectivo BOOLEAN NOT NULL,
    estado estado_metodo_pago_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE membresia (
    id SERIAL PRIMARY KEY,
    profesional_negocio_id INTEGER NOT NULL REFERENCES profesional_negocio(id),
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
    id SERIAL PRIMARY KEY,
    metodo_pago_id INTEGER NOT NULL REFERENCES metodo_pago(id),
    cliente_id INTEGER REFERENCES cliente(id),
    reserva_id INTEGER REFERENCES reserva(id),
    profesional_id INTEGER REFERENCES profesional(id),
    membresia_id INTEGER REFERENCES membresia(id),
		numero VARCHAR(30) NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    estado estado_pago_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comprobante (
    id SERIAL PRIMARY KEY,
    pago_id INTEGER NOT NULL REFERENCES pago(id),
    archivo_id INTEGER NOT NULL REFERENCES archivo(id),
    estado estado_comprobante_enum NOT NULL DEFAULT 'PENDIENTE',
    observacion TEXT,
    validado_por_profesional_id INTEGER REFERENCES profesional(id),
    validado_por_gerencia_id INTEGER REFERENCES gerencia(id),
    fecha_validacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE negocio_archivo (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER NOT NULL REFERENCES negocio(id),
    archivo_id INTEGER NOT NULL REFERENCES archivo(id),

    tipo tipo_servicio_archivo_enum NOT NULL DEFAULT 'FOTO',
    orden INTEGER NOT NULL DEFAULT 1,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
		
    UNIQUE (negocio_id, archivo_id)
);

CREATE TABLE profesional_archivo (
    id SERIAL PRIMARY KEY,
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),
    archivo_id INTEGER NOT NULL REFERENCES archivo(id),
    UNIQUE (profesional_id, archivo_id)
);

CREATE TABLE servicio_archivo (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES servicio(id),
    archivo_id INTEGER NOT NULL REFERENCES archivo(id),

    tipo tipo_servicio_archivo_enum NOT NULL,

    orden INTEGER NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE (servicio_id, archivo_id),
    UNIQUE (servicio_id, tipo, orden)
);

CREATE TABLE historial (
    id SERIAL PRIMARY KEY,

    negocio_id INTEGER NOT NULL REFERENCES negocio(id),
    cliente_id INTEGER NOT NULL REFERENCES cliente(id),
    profesional_id INTEGER NOT NULL REFERENCES profesional(id),
    servicio_id INTEGER NOT NULL REFERENCES servicio(id),
    reserva_id INTEGER NOT NULL REFERENCES reserva(id),

    fecha DATE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT historial_reserva_unique UNIQUE (reserva_id)
);

CREATE TABLE segmentacion (
    id SERIAL PRIMARY KEY,
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
    id SERIAL PRIMARY KEY,
    historial_id INTEGER NOT NULL REFERENCES historial(id),
    segmentacion_id INTEGER NOT NULL REFERENCES segmentacion(id),
    UNIQUE (historial_id, segmentacion_id)
);

CREATE TABLE tipo_calificacion (
    id SERIAL PRIMARY KEY,

    codigo VARCHAR(50) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,

    objetivo objetivo_calificacion_enum NOT NULL,
    estado estado_tipo_calificacion_enum NOT NULL DEFAULT 'ACTIVO',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_tipo_calificacion_objetivo_codigo UNIQUE (objetivo, codigo)
);

CREATE TABLE calificacion (
    id SERIAL PRIMARY KEY,
    evaluacion_id INTEGER NOT NULL REFERENCES evaluacion(id),
    reserva_id INTEGER NOT NULL REFERENCES reserva(id),

    cliente_id INTEGER REFERENCES cliente(id),
    profesional_id INTEGER REFERENCES profesional(id),
    negocio_id INTEGER REFERENCES negocio(id),
    servicio_id INTEGER REFERENCES servicio(id),
    gerencia_id INTEGER REFERENCES gerencia(id),

    puntaje NUMERIC(5,2) NOT NULL,
    titulo VARCHAR(200),
    observacion TEXT,

    estado estado_calificacion_enum NOT NULL DEFAULT 'ACTIVA',

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT LOCALTIME,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_calificacion_reserva_evaluacion UNIQUE (reserva_id, evaluacion_id),
    CONSTRAINT chk_calificacion_puntaje CHECK (puntaje BETWEEN 0 AND 5)
);

CREATE TABLE ranking (
    id SERIAL PRIMARY KEY,
    tipo tipo_ranking_enum NOT NULL,
    descripcion TEXT,
    cantidad_minima_calificaciones INTEGER NOT NULL,
    estado estado_ranking_enum NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluacion (
    id SERIAL PRIMARY KEY,

    cliente_id INTEGER REFERENCES cliente(id),
    profesional_id INTEGER REFERENCES profesional(id),
    negocio_id INTEGER REFERENCES negocio(id),
    servicio_id INTEGER REFERENCES servicio(id),
    gerencia_id INTEGER REFERENCES gerencia(id),    

    tipo_calificacion_id INTEGER NOT NULL REFERENCES tipo_calificacion(id),

    puntaje_promedio NUMERIC(5,2) NOT NULL DEFAULT 0,
    cantidad_calificaciones INTEGER NOT NULL DEFAULT 0,

    estado estado_evaluacion_enum NOT NULL DEFAULT 'DESHABILITADO',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_evaluacion_tipo_calificacion UNIQUE (tipo_calificacion_id)
);

CREATE TABLE ranking_detalle (
    id SERIAL PRIMARY KEY,
    ranking_id INTEGER NOT NULL REFERENCES ranking(id),
    evaluacion_id INTEGER NOT NULL REFERENCES evaluacion(id),
    profesional_id INTEGER REFERENCES profesional(id),
    negocio_id INTEGER REFERENCES negocio(id),
    servicio_id INTEGER REFERENCES servicio(id),
    gerencia_id INTEGER REFERENCES gerencia(id),
    posicion INTEGER NOT NULL,
    puntaje NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reclamo (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id),
    profesional_id INTEGER REFERENCES profesional(id),
    negocio_id INTEGER REFERENCES negocio(id),
    servicio_id INTEGER REFERENCES servicio(id),
    gerencia_id INTEGER REFERENCES gerencia(id),
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
    id SERIAL PRIMARY KEY,

    cliente_id INTEGER REFERENCES cliente(id),
    profesional_id INTEGER REFERENCES profesional(id),
    gerente_id INTEGER REFERENCES gerente(id),
    gerencia_id INTEGER REFERENCES gerencia(id),
    negocio_id INTEGER REFERENCES negocio(id),

    reserva_id INTEGER REFERENCES reserva(id),
    evaluacion_id INTEGER REFERENCES evaluacion(id),

    pago_id INTEGER REFERENCES pago(id),
    membresia_id INTEGER REFERENCES membresia(id),
    reclamo_id INTEGER REFERENCES reclamo(id),
    promocion_id INTEGER REFERENCES promocion(id),
    descuento_id INTEGER REFERENCES descuento(id),
    servicio_id INTEGER REFERENCES servicio(id),

    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,

    estado estado_notificacion_enum NOT NULL DEFAULT 'NO_LEIDA',

    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_lectura TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorito (
    id SERIAL PRIMARY KEY,

    cliente_id INTEGER NOT NULL
        REFERENCES cliente(id),

    negocio_id INTEGER
        REFERENCES negocio(id),

    profesional_id INTEGER
        REFERENCES profesional(id),

    servicio_id INTEGER
        REFERENCES servicio(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_favorito_un_solo_tipo CHECK (
        (negocio_id IS NOT NULL)::INTEGER +
        (profesional_id IS NOT NULL)::INTEGER +
        (servicio_id IS NOT NULL)::INTEGER = 1
    )
);

-- ============================================================
-- TABLA: bloqueo
-- Bloqueos temporales de slots para una fecha específica
-- ============================================================

CREATE TABLE bloqueo (
    id SERIAL PRIMARY KEY,

    negocio_id INTEGER NOT NULL,
    profesional_id INTEGER NOT NULL,

    fecha DATE NOT NULL,

    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    motivo VARCHAR(255),

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bloqueo_negocio
        FOREIGN KEY (negocio_id)
        REFERENCES negocio(id),

    CONSTRAINT fk_bloqueo_profesional
        FOREIGN KEY (profesional_id)
        REFERENCES profesional(id),

    CONSTRAINT chk_bloqueo_horas
        CHECK (hora_fin > hora_inicio),

    CONSTRAINT chk_bloqueo_estado
        CHECK (estado IN ('ACTIVO', 'CANCELADO'))
);

CREATE TABLE especialidad (
    id SERIAL PRIMARY KEY,

    negocio_id INTEGER NOT NULL REFERENCES negocio(id) ON DELETE CASCADE,

    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_especialidad_negocio_nombre
        UNIQUE (negocio_id, nombre)
);

-- ÍNDICES
CREATE INDEX idx_usuario_persona ON usuario(persona_id);
CREATE INDEX idx_usuario_rol ON usuario(rol_id);
CREATE INDEX idx_cliente_persona ON cliente(persona_id);
CREATE INDEX idx_profesional_persona ON profesional(persona_id);
CREATE INDEX idx_gerencia_gerente ON gerencia(gerente_id);
CREATE INDEX idx_horario_negocio ON horario(negocio_id);
CREATE INDEX idx_horario_profesional_horario ON horario_profesional(horario_id);
CREATE INDEX idx_horario_profesional_profesional ON horario_profesional(profesional_id);
CREATE INDEX idx_servicio_profesional ON servicio(profesional_id);
CREATE INDEX idx_reserva_cliente ON reserva(cliente_id);
CREATE INDEX idx_reserva_servicio ON reserva(servicio_id);
CREATE INDEX idx_reserva_slot_reserva ON reserva_slot(reserva_id);
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
CREATE UNIQUE INDEX uq_reserva_slot_activo ON reserva_slot(slot_id) WHERE activo = TRUE;

CREATE UNIQUE INDEX uq_favorito_cliente_negocio ON favorito(cliente_id, negocio_id) WHERE negocio_id IS NOT NULL;
CREATE UNIQUE INDEX uq_favorito_cliente_profesional ON favorito(cliente_id, profesional_id) WHERE profesional_id IS NOT NULL;
CREATE UNIQUE INDEX uq_favorito_cliente_servicio ON favorito(cliente_id, servicio_id) WHERE servicio_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_evaluacion_habilitada_por_objetivo ON evaluacion (( SELECT NULL));
CREATE INDEX idx_notificacion_cliente_reserva_evaluacion ON notificacion (cliente_id, reserva_id, evaluacion_id);

CREATE UNIQUE INDEX uq_descuento_servicio_cliente_activo ON descuento_servicio_cliente (descuento_servicio_id, cliente_id) WHERE estado_aplicado = 'ACTIVO';

CREATE INDEX idx_especialidad_busqueda ON especialidad (negocio_id, estado);
CREATE INDEX idx_especialidad_nombre ON especialidad (LOWER(nombre));

COMMIT;
	