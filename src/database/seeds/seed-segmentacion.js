const seedSegmentacion = async (client) => {
  const segmentos = [
    {
      nombre: "NUEVO",
      descripcion: "Nuevo cliente con atención",
      orden: 1,
      min_atenciones: 1,
      periodo_dias: 0,
      max_intervalo_dias: 0,
      max_dias_ultima_atencion: 0,
    },
    {
      nombre: "OCASIONAL",
      descripcion: "Cliente ocasional",
      orden: 2,
      min_atenciones: 2,
      periodo_dias: 90,
      max_intervalo_dias: 90,
      max_dias_ultima_atencion: 120,
    },
    {
      nombre: "CONSTANTE",
      descripcion: "Cliente constante",
      orden: 3,
      min_atenciones: 3,
      periodo_dias: 60,
      max_intervalo_dias: 30,
      max_dias_ultima_atencion: 60,
    },
    {
      nombre: "FRECUENTE",
      descripcion: "Cliente frecuente",
      orden: 4,
      min_atenciones: 5,
      periodo_dias: 90,
      max_intervalo_dias: 25,
      max_dias_ultima_atencion: 60,
    },
    {
      nombre: "FIEL",
      descripcion: "Cliente fiel",
      orden: 5,
      min_atenciones: 8,
      periodo_dias: 180,
      max_intervalo_dias: 30,
      max_dias_ultima_atencion: 60,
    },
  ];

  for (const segmento of segmentos) {
    const existente = await client.query(
      `
        SELECT id
        FROM segmentacion
        WHERE nombre = $1
        LIMIT 1
      `,
      [segmento.nombre],
    );

    if (existente.rows.length > 0) {
      await client.query(
        `
          UPDATE segmentacion
          SET
            descripcion = $2,
            orden = $3,
            min_atenciones = $4,
            periodo_dias = $5,
            max_intervalo_dias = $6,
            max_dias_ultima_atencion = $7,
            estado = 'ACTIVO'
          WHERE nombre = $1
        `,
        [
          segmento.nombre,
          segmento.descripcion,
          segmento.orden,
          segmento.min_atenciones,
          segmento.periodo_dias,
          segmento.max_intervalo_dias,
          segmento.max_dias_ultima_atencion,
        ],
      );
    } else {
      await client.query(
        `
          INSERT INTO segmentacion (
            nombre,
            descripcion,
            orden,
            min_atenciones,
            periodo_dias,
            max_intervalo_dias,
            max_dias_ultima_atencion,
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
            'ACTIVO'
          )
        `,
        [
          segmento.nombre,
          segmento.descripcion,
          segmento.orden,
          segmento.min_atenciones,
          segmento.periodo_dias,
          segmento.max_intervalo_dias,
          segmento.max_dias_ultima_atencion,
        ],
      );
    }
  }

  console.log("✅ Segmentaciones inicializadas");
};

module.exports = seedSegmentacion;
