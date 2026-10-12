const seedTipoCalificacion = async (client) => {
  const tipos = [
    // =====================================================
    // PROFESIONAL
    // =====================================================
    {
      codigo: "ATENCION",
      tipo: "Atención al cliente",
      descripcion:
        "Evalúa el trato, la amabilidad y el respeto hacia el cliente.",
      objetivo: "PROFESIONAL",
    },
    {
      codigo: "DESTREZA",
      tipo: "Habilidad técnica",
      descripcion:
        "Evalúa la habilidad técnica y el dominio del oficio del profesional.",
      objetivo: "PROFESIONAL",
    },
    {
      codigo: "RENDIMIENTO",
      tipo: "Eficiencia y cumplimiento",
      descripcion:
        "Evalúa la eficiencia y el cumplimiento durante la prestación del servicio.",
      objetivo: "PROFESIONAL",
    },
    {
      codigo: "PUNTUALIDAD",
      tipo: "Respeto del horario",
      descripcion:
        "Evalúa el cumplimiento del horario acordado con el cliente.",
      objetivo: "PROFESIONAL",
    },
    {
      codigo: "PROFESIONALISMO",
      tipo: "Responsabilidad e higiene",
      descripcion:
        "Evalúa la responsabilidad, la presentación y las prácticas de higiene del profesional.",
      objetivo: "PROFESIONAL",
    },

    // =====================================================
    // SERVICIO
    // =====================================================
    {
      codigo: "CALIDAD",
      tipo: "Resultado del servicio",
      descripcion:
        "Evalúa la calidad del resultado final del servicio recibido.",
      objetivo: "SERVICIO",
    },
    {
      codigo: "SATISFACCION",
      tipo: "Satisfacción del cliente",
      descripcion:
        "Evalúa el nivel de satisfacción del cliente con el servicio recibido.",
      objetivo: "SERVICIO",
    },
    {
      codigo: "RELACION_PRECIO_CALIDAD",
      tipo: "Valor por el precio",
      descripcion:
        "Evalúa la relación entre el precio pagado y la calidad del servicio recibido.",
      objetivo: "SERVICIO",
    },

    // =====================================================
    // NEGOCIO
    // =====================================================
    {
      codigo: "ATENCION",
      tipo: "Atención del establecimiento",
      descripcion:
        "Evalúa la atención brindada por el establecimiento al cliente.",
      objetivo: "NEGOCIO",
    },
    {
      codigo: "AMBIENTE",
      tipo: "Comodidad del local",
      descripcion: "Evalúa la comodidad y el ambiente del establecimiento.",
      objetivo: "NEGOCIO",
    },
    {
      codigo: "HIGIENE",
      tipo: "Limpieza del establecimiento",
      descripcion: "Evalúa la limpieza y la higiene de las instalaciones.",
      objetivo: "NEGOCIO",
    },
    {
      codigo: "RELACION_PRECIO_CALIDAD",
      tipo: "Valor ofrecido por el negocio",
      descripcion:
        "Evalúa la relación entre el precio y la experiencia ofrecida por el establecimiento.",
      objetivo: "NEGOCIO",
    },

    // =====================================================
    // PIA
    // =====================================================
    {
      codigo: "FACILIDAD_USO",
      tipo: "Facilidad para reservar",
      descripcion:
        "Evalúa la facilidad para buscar servicios y realizar reservas en PIA.",
      objetivo: "PIA",
    },
    {
      codigo: "CONFIABILIDAD",
      tipo: "Confianza en la plataforma",
      descripcion:
        "Evalúa la confianza que transmite PIA en la información y las reservas.",
      objetivo: "PIA",
    },
    {
      codigo: "EXPERIENCIA_USUARIO",
      tipo: "Experiencia general",
      descripcion: "Evalúa la experiencia general del cliente al utilizar PIA.",
      objetivo: "PIA",
    },
    {
      codigo: "SOPORTE",
      tipo: "Ayuda al usuario",
      descripcion:
        "Evalúa la calidad de la asistencia brindada a los usuarios de PIA.",
      objetivo: "PIA",
    },
  ];

  for (const tipo of tipos) {
    await client.query(
      `
        INSERT INTO tipo_calificacion (
          codigo,
          tipo,
          descripcion,
          objetivo,
          estado
        )
        VALUES ($1, $2, $3, $4, 'ACTIVO')
        ON CONFLICT (objetivo, codigo)
        DO UPDATE SET
          tipo = EXCLUDED.tipo,
          descripcion = EXCLUDED.descripcion,
          estado = 'ACTIVO',
          updated_at = CURRENT_TIMESTAMP
      `,
      [tipo.codigo, tipo.tipo, tipo.descripcion, tipo.objetivo],
    );
  }

  console.log("✅ Tipos de calificación inicializados");
};

module.exports = seedTipoCalificacion;
