const seedTiposNegocio = async (client) => {
	const tipos_negocios = [
		// =============================================
		// CABELLO Y BARBERÍA
		// =============================================
		{
			nombre: "Salón de Belleza",
			descripcion:
				"Establecimiento que ofrece servicios de peluquería, cortes, peinados, coloración, tratamientos capilares y otros servicios de belleza.",
			icono: "mdi-face-woman",
		},
		{
			nombre: "Barbería",
			descripcion:
				"Negocio especializado en cortes masculinos, afeitado, arreglo de barba, bigote y cuidado de imagen masculina.",
			icono: "mdi-content-cut",
		},
		{
			nombre: "Peluquería",
			descripcion:
				"Establecimiento dedicado al corte, peinado, coloración y tratamientos del cabello para hombres, mujeres o ambos.",
			icono: "mdi-content-cut",
		},
		{
			nombre: "Estudio de Trenzas y Cabello Afro",
			descripcion:
				"Negocio especializado en trenzas, peinados afro, cuidado de cabello texturizado y estilos protectores.",
			icono: "mdi-account",
		},
		{
			nombre: "Estudio de Extensiones Capilares",
			descripcion:
				"Establecimiento especializado en colocación, mantenimiento y retiro de extensiones capilares.",
			icono: "mdi-account-circle",
		},
		{
			nombre: "Centro de Tratamientos Capilares",
			descripcion:
				"Negocio dedicado a tratamientos cosméticos capilares, hidratación, reparación, keratina y cuidado del cabello.",
			icono: "mdi-water",
		},

		// =============================================
		// UÑAS, PESTAÑAS Y CEJAS
		// =============================================
		{
			nombre: "Spa",
			descripcion:
				"Negocio orientado al bienestar y la relajación mediante masajes, tratamientos corporales, faciales y cuidado personal.",
			icono: "mdi-spa",
		},
		{
			nombre: "Centro de Estética",
			descripcion:
				"Establecimiento especializado en tratamientos estéticos faciales y corporales, cuidado de la piel y procedimientos no médicos.",
			icono: "mdi-face-woman",
		},
		{
			nombre: "Centro de Belleza",
			descripcion:
				"Negocio que reúne diferentes servicios de belleza, como peluquería, uñas, maquillaje, estética y cuidado personal.",
			icono: "mdi-star-four-points",
		},
		{
			nombre: "Nail Studio / Salón de Uñas",
			descripcion:
				"Establecimiento especializado en manicure, pedicure, uñas acrílicas, gel, esmaltado y decoración de uñas.",
			icono: "mdi-palette",
		},
		{
			nombre: "Estudio de Maquillaje",
			descripcion:
				"Negocio especializado en maquillaje profesional para eventos, sesiones fotográficas, novias y ocasiones especiales.",
			icono: "mdi-palette-outline",
		},
		{
			nombre: "Estudio de Pestañas y Cejas",
			descripcion:
				"Establecimiento dedicado al diseño y cuidado de cejas, extensiones de pestañas, lifting, laminado y servicios relacionados.",
			icono: "mdi-eye-outline",
		},
		{
			nombre: "Estudio de Maquillaje Permanente",
			descripcion:
				"Negocio especializado en maquillaje permanente o semipermanente, sujeto a las habilitaciones y medidas sanitarias aplicables.",
			icono: "mdi-needle",
		},

		// =============================================
		// ESTÉTICA Y CUIDADO DE LA PIEL
		// =============================================
		{
			nombre: "Centro de Cosmetología",
			descripcion:
				"Establecimiento dedicado al cuidado cosmético de la piel, tratamientos faciales y servicios de cosmetología.",
			icono: "mdi-flower",
		},
		{
			nombre: "Centro de Depilación",
			descripcion:
				"Negocio especializado en servicios de depilación y eliminación de vello mediante diferentes técnicas.",
			icono: "mdi-circle-outline",
		},
		{
			nombre: "Centro de Cuidado de la Piel",
			descripcion:
				"Establecimiento dedicado al cuidado cosmético de la piel y tratamientos orientados a mejorar su apariencia.",
			icono: "mdi-water",
		},
		{
			nombre: "Centro de Depilación Láser",
			descripcion:
				"Establecimiento especializado en servicios de reducción del vello mediante tecnología láser, conforme a los requisitos aplicables.",
			icono: "mdi-flash",
		},
		{
			nombre: "Centro de Bronceado",
			descripcion:
				"Negocio especializado en servicios cosméticos de bronceado y coloración estética de la piel.",
			icono: "mdi-white-balance-sunny",
		},
		{
			nombre: "Centro de Tratamientos Corporales",
			descripcion:
				"Establecimiento que ofrece tratamientos cosméticos corporales y servicios de cuidado de la piel del cuerpo.",
			icono: "mdi-human",
		},
		{
			nombre: "Centro de Estética Médica",
			descripcion:
				"Establecimiento de estética médica que ofrece procedimientos dentro del ámbito profesional y sanitario autorizado.",
			icono: "mdi-medical-bag",
		},

		// =============================================
		// BIENESTAR
		// =============================================
		{
			nombre: "Centro de Masajes",
			descripcion:
				"Negocio dedicado a masajes de relajación y bienestar corporal, según los servicios que ofrezca.",
			icono: "mdi-hand-heart",
		},
		{
			nombre: "Sauna y Baños de Vapor",
			descripcion:
				"Establecimiento que ofrece instalaciones y servicios de sauna, baños de vapor y relajación.",
			icono: "mdi-thermometer",
		},
		{
			nombre: "Centro de Bienestar Integral",
			descripcion:
				"Negocio que reúne servicios de relajación, autocuidado y bienestar personal.",
			icono: "mdi-heart-pulse",
		},

		// =============================================
		// ARTE CORPORAL
		// =============================================
		{
			nombre: "Estudio de Tatuajes y Piercing",
			descripcion:
				"Negocio especializado en tatuajes, perforaciones corporales y servicios relacionados con modificación estética corporal.",
			icono: "mdi-needle",
		},
		{
			nombre: "Estudio de Henna y Arte Corporal",
			descripcion:
				"Establecimiento especializado en diseños decorativos con henna y otras formas de arte corporal no permanente.",
			icono: "mdi-palette",
		},

		// =============================================
		// COMERCIO Y FORMACIÓN
		// =============================================
		{
			nombre: "Tienda de Cosméticos",
			descripcion:
				"Negocio dedicado a la venta de cosméticos, maquillaje y productos de cuidado personal.",
			icono: "mdi-store",
		},
		{
			nombre: "Perfumería",
			descripcion:
				"Establecimiento especializado en la venta de perfumes, fragancias y productos aromáticos.",
			icono: "mdi-flower",
		},
		{
			nombre: "Academia de Belleza y Cosmetología",
			descripcion:
				"Centro de formación que ofrece cursos y capacitación en belleza, peluquería, cosmetología y especialidades relacionadas.",
			icono: "mdi-school",
		},
		{
			nombre: "Asesoría de Imagen Personal",
			descripcion:
				"Negocio que ofrece asesoramiento de imagen, estilo personal, combinación de prendas y presentación.",
			icono: "mdi-account-tie",
		},
	];

	for (const tipo of tipos_negocios) {
		await client.query(
			`
        INSERT INTO tipo_negocio (
          nombre,
          descripcion,
          icono
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (nombre)
        DO UPDATE SET
          descripcion = EXCLUDED.descripcion,
          icono = EXCLUDED.icono
      `,
			[tipo.nombre, tipo.descripcion, tipo.icono],
		);
	}

	console.log("✅ Tipos de negocio inicializados");
};

module.exports = seedTiposNegocio;
