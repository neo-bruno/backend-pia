const seedTiposNegocio = async (client) => {
  const tipos_negocios = [
    {
      nombre: "Salón de Belleza",
      descripcion: "Establecimiento que ofrece servicios de peluquería, cortes, peinados, coloración, tratamientos capilares y otros servicios de belleza.",
    },
    {
      nombre: "Barbería",
      descripcion: "Negocio especializado principalmente en cortes masculinos, afeitado, arreglo de barba, bigote y cuidado de imagen masculina.",
    },
    {
      nombre: "Peluquería",
      descripcion: "Establecimiento dedicado principalmente al corte, peinado, coloración y tratamientos del cabello para hombres, mujeres o ambos."
    },
    {
      nombre: "Spa",
      descripcion: "Negocio orientado al bienestar y relajación mediante masajes, tratamientos corporales, faciales y servicios de cuidado personal."
    },
    {
      nombre: "Centro de Estética",
      descripcion: "Establecimiento especializado en tratamientos estéticos faciales y corporales, cuidado de la piel y procedimientos no médicos."
    },
    {
      nombre: "Centro de Belleza",
      descripcion: "Negocio que reúne diferentes servicios de belleza, como peluquería, uñas, maquillaje, estética y cuidado personal."
    },
    {
      nombre: "Nail Studio / Salón de Uñas",
      descripcion: "Establecimiento especializado en manicure, pedicure, uñas acrílicas, gel, esmaltado y decoración de uñas."
    },
    {
      nombre: "Estudio de Maquillaje",
      descripcion: "Negocio especializado en maquillaje profesional para eventos, sesiones fotográficas, novias y ocasiones especiales."
    },
    {
      nombre: "Estudio de Pestañas y Cejas",
      descripcion: "Establecimiento dedicado al diseño y cuidado de cejas, extensiones de pestañas, lifting, laminado y servicios relacionados."
    },
    {
      nombre: "Centro de Depilación",
      descripcion: "Negocio especializado en servicios de depilación y eliminación de vello mediante diferentes técnicas."
    },
    {
      nombre: "Centro de Cosmetología",
      descripcion: "Establecimiento dedicado al cuidado cosmético de la piel, tratamientos faciales y servicios de cosmetología."
    },
    {
      nombre: "Estudio de Tatuajes y Piercing",
      descripcion: "Negocio especializado en tatuajes, perforaciones corporales y servicios relacionados con modificación estética corporal."
    },
  ];

  for (const tipo of tipos_negocios) {
    await client.query(      `
                INSERT INTO tipo_negocio (
                    nombre,
                    descripcion
                )
                VALUES ($1, $2)
                ON CONFLICT (nombre)
                DO UPDATE SET
                    descripcion = EXCLUDED.descripcion
            `,
      [tipo.nombre, tipo.descripcion],
    );
  }

  console.log("✅ Tipos de Negocio Inicializados");
};

module.exports = seedTiposNegocio;
