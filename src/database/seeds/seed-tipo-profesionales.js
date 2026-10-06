const seedTiposProfesiones = async (client) => {
  const tipos_profesiones = [
    {
      nombre: "Estilista",
      descripcion:
        "Profesional especializado en corte, peinado, coloración y cuidado integral del cabello.",
    },
    {
      nombre: "Barbero",
      descripcion:
        "Profesional especializado en cortes masculinos, afeitado, arreglo y cuidado de barba y bigote.",
    },
    {
      nombre: "Colorista",
      descripcion:
        "Profesional especializado en coloración, decoloración, tintes, mechas y técnicas de transformación del color del cabello.",
    },
    {
      nombre: "Peinador",
      descripcion:
        "Profesional especializado en peinados, recogidos y estilismo del cabello para diferentes ocasiones.",
    },
    {
      nombre: "Manicurista",
      descripcion:
        "Profesional especializado en manicure, cuidado de manos, esmaltado y decoración de uñas.",
    },
    {
      nombre: "Pedicurista",
      descripcion:
        "Profesional especializado en pedicure, cuidado de pies y tratamiento estético de las uñas de los pies.",
    },
    {
      nombre: "Técnico de Uñas",
      descripcion:
        "Profesional especializado en uñas acrílicas, gel, extensiones, esmaltado permanente y técnicas de decoración.",
    },
    {
      nombre: "Maquillador",
      descripcion:
        "Profesional especializado en maquillaje para eventos, novias, sesiones fotográficas y diferentes ocasiones.",
    },
    {
      nombre: "Cosmetólogo",
      descripcion:
        "Profesional especializado en tratamientos cosméticos, cuidado de la piel y procedimientos estéticos no médicos.",
    },
    {
      nombre: "Esteticista",
      descripcion:
        "Profesional especializado en tratamientos estéticos faciales y corporales orientados al cuidado y bienestar.",
    },
    {
      nombre: "Especialista en Pestañas",
      descripcion:
        "Profesional especializado en extensiones de pestañas, lifting, tinte y técnicas de embellecimiento de pestañas.",
    },
    {
      nombre: "Diseñador de Cejas",
      descripcion:
        "Profesional especializado en diseño, depilación, perfilado, laminado y cuidado estético de las cejas.",
    },
    {
      nombre: "Masajista",
      descripcion:
        "Profesional especializado en masajes de relajación, bienestar y diferentes técnicas de masaje corporal.",
    },
    {
      nombre: "Terapeuta Spa",
      descripcion:
        "Profesional especializado en tratamientos de spa, bienestar, relajación y terapias corporales.",
    },
    {
      nombre: "Depilador",
      descripcion:
        "Profesional especializado en servicios de depilación mediante diferentes técnicas y métodos de eliminación del vello.",
    },
    {
      nombre: "Especialista en Tratamientos Capilares",
      descripcion:
        "Profesional especializado en tratamientos destinados al cuidado, recuperación y mantenimiento de la salud capilar.",
    },
    {
      nombre: "Asesor de Imagen",
      descripcion:
        "Profesional que asesora sobre imagen personal, estilo, apariencia y combinación de elementos para mejorar la presentación personal.",
    },
  ];

  for (const tipo of tipos_profesiones) {
    await client.query(
      `
        INSERT INTO tipo_profesional (
          nombre,
          descripcion
        )
        VALUES ($1, $2)
        ON CONFLICT (nombre)
        DO UPDATE SET
          descripcion = EXCLUDED.descripcion,
          updated_at = CURRENT_TIMESTAMP
      `,
      [tipo.nombre, tipo.descripcion],
    );
  }

  console.log("✅ Tipos de Profesionales Inicializados");
};

module.exports = seedTiposProfesiones;
