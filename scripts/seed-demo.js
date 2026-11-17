/**
 * PIA DEMO SEED
 * Ejecutar desde backend:
 * PIA_DEMO_PASSWORD="DemoPIA2026*" node scripts/seed-demo.js
 *
 * Inserta 50 negocios, 120 profesionales, 360 servicios,
 * 120 membresías (5 Bs / un mes) y 120 pagos.
 * No modifica registros existentes ni crea comprobantes falsos.
 */
require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/database/pool");

const PASSWORD = process.env.PIA_DEMO_PASSWORD;
const ADMIN_ID = 2;
const QR_ID = 1;
const PHONE_BASE = 70000000;

const negocios = [
	["Luna Studio", 1],
	["Barbería Distrito", 2],
	["Aura Beauty", 9],
	["Mía Nail Studio", 10],
	["Nova Hair", 3],
	["Esencia Spa", 7],
	["Bella Piel", 16],
	["Studio Glam", 11],
	["Mirada Perfecta", 12],
	["Capilar Pro", 6],
	["D' Lujo Estética", 8],
	["Urban Cuts", 2],
	["Rosa Beauty", 1],
	["Nativa Trenzas", 4],
	["Silk Extensions", 5],
	["Pestañas VIP", 12],
	["Manos de Seda", 10],
	["Skin Care Center", 16],
	["Zen Masajes", 21],
	["Laser & Glow", 17],
	["Studio Cejas", 12],
	["Color Lab", 6],
	["Barber House", 2],
	["Divina Estética", 20],
	["Brillo Natural", 1],
	["Pink Nails", 10],
	["Makeup Room", 11],
	["Spa Armonía", 23],
	["Depilación Suave", 15],
	["Belleza Total", 9],
	["Hair Concept", 3],
	["The Barber Club", 2],
	["Miracle Skin", 16],
	["Lashes House", 12],
	["Golden Tan", 18],
	["Cuerpo & Vida", 19],
	["Cosmo Studio", 14],
	["Trendy Hair", 1],
	["Nail Art", 10],
	["Image Consulting", 29],
	["Tatto Art", 24],
	["Perfume Boutique", 27],
	["Beauty Market", 26],
	["Academia Glam", 28],
	["Steam & Relax", 22],
	["Henna Studio", 25],
	["Peluquería Elegance", 3],
	["Barbería Central", 2],
	["Estética Avanzada", 20],
	["Extensiones Pro", 5],
];
const zonas = {
	Cochabamba: [
		"Queru Queru",
		"Recoleta",
		"Cala Cala",
		"Centro",
		"Sarco",
		"Tiquipaya",
		"Temporal",
		"Muyurina",
		"Alalay",
	],
	"Santa Cruz": [
		"Equipetrol",
		"Urbarí",
		"Centro",
		"Las Palmas",
		"Hamacas",
		"Sirari",
		"Norte",
		"Plan 3000",
	],
	"La Paz": [
		"Sopocachi",
		"Calacoto",
		"San Miguel",
		"Centro",
		"Miraflores",
		"Achumani",
		"Obrajes",
		"Zona Sur",
	],
};
const ciudades = negocios.map((_, i) =>
	i < 25
		? ["Cochabamba", "Cochabamba"]
		: i < 40
			? ["Santa Cruz", "Santa Cruz de la Sierra"]
			: ["La Paz", "La Paz"],
);
const nombres = [
	"Valentina",
	"Camila",
	"Daniela",
	"Lucía",
	"Mariana",
	"Sofía",
	"Gabriela",
	"Fernanda",
	"Carolina",
	"Alejandra",
	"Paola",
	"Andrea",
	"Natalia",
	"Jazmín",
	"Micaela",
	"Renata",
	"Isabella",
	"Claudia",
	"Diego",
	"Mateo",
	"Sebastián",
	"Nicolás",
	"Gabriel",
	"Andrés",
	"Fernando",
	"Javier",
	"Santiago",
	"Adrián",
	"Rodrigo",
	"Marco",
];
const apellidos = [
	"Rojas",
	"Vargas",
	"Mendoza",
	"Rivera",
	"Gutiérrez",
	"Flores",
	"Fernández",
	"Cárdenas",
	"Sánchez",
	"Molina",
	"Paredes",
	"Suárez",
	"Torres",
	"Castro",
	"Cabrera",
	"Navarro",
	"Salazar",
	"Arias",
	"Morales",
	"Vega",
	"Aguilar",
	"Duarte",
	"Romero",
	"Ortiz",
];
const tiposProf = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const servicios = [
	[
		"Corte de cabello",
		"Corte personalizado según estilo y tipo de rostro",
		30,
		45,
	],
	["Corte y peinado", "Corte acompañado de peinado profesional", 60, 90],
	["Lavado y brushing", "Lavado capilar y secado con brushing", 45, 55],
	["Coloración completa", "Aplicación de color profesional", 120, 280],
	[
		"Mechas y balayage",
		"Iluminación personalizada con técnica balayage",
		180,
		450,
	],
	["Tratamiento capilar", "Hidratación y reparación profunda", 60, 120],
	["Alisado", "Tratamiento de alisado y control de frizz", 120, 250],
	["Barba clásica", "Perfilado y arreglo de barba", 30, 35],
	["Corte fade", "Corte degradado con máquina y tijera", 45, 50],
	["Manicure", "Limpieza, limado y esmaltado", 45, 50],
	["Pedicure", "Cuidado estético de pies y uñas", 60, 65],
	["Uñas acrílicas", "Aplicación y diseño de uñas acrílicas", 90, 130],
	["Esmaltado semipermanente", "Esmaltado de larga duración", 60, 75],
	["Lifting de pestañas", "Realce y curvatura de pestañas", 60, 90],
	[
		"Extensiones de pestañas",
		"Aplicación de extensiones según diseño",
		120,
		160,
	],
	["Diseño de cejas", "Diseño y perfilado según el rostro", 30, 40],
	["Limpieza facial", "Limpieza facial profunda", 60, 110],
	["Maquillaje social", "Maquillaje profesional para eventos", 75, 150],
	["Masaje relajante", "Masaje corporal para relajación", 60, 120],
	["Depilación", "Depilación profesional por zona", 30, 50],
	["Peinado para evento", "Peinado profesional para ocasión especial", 60, 100],
	["Trenzas", "Diseño y elaboración de trenzas", 90, 120],
	["Extensiones capilares", "Colocación y ajuste de extensiones", 120, 250],
	["Micropigmentación", "Diseño semipermanente de cejas", 120, 350],
	["Tratamiento antiacné", "Protocolo estético para piel", 60, 150],
];
const pick = (a, i, m = 1) => a[(i * m) % a.length];
const slug = (s) =>
	s
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

async function main() {
	if (!PASSWORD || PASSWORD.length < 8)
		throw new Error("Configura PIA_DEMO_PASSWORD (mínimo 8 caracteres).");
	const client = await pool.connect();
	const totals = {
		negocios: 0,
		profesionales: 0,
		servicios: 0,
		membresias: 0,
		pagos: 0,
	};
	try {
		await client.query("BEGIN");
		await client.query("SELECT pg_advisory_xact_lock(2026111101)");
		for (const [table, id, name] of [
			["rol", ADMIN_ID, "ADMIN"],
			["metodo_pago", QR_ID, "QR"],
		]) {
			const q = await client.query(
				`SELECT id,nombre FROM ${table} WHERE id=$1`,
				[id],
			);
			if (!q.rows[0] || q.rows[0].nombre.toUpperCase() !== name)
				throw new Error(`${table} id ${id} no corresponde a ${name}.`);
		}
		const existing = await client.query(
			"SELECT COUNT(*)::int total FROM negocio WHERE codigo LIKE 'DEMO-PIA-%'",
		);
		if (existing.rows[0].total)
			throw new Error(
				`Ya existen ${existing.rows[0].total} negocios DEMO. No se insertó nada.`,
			);
		const activeN = await client.query(
			"SELECT id FROM tipo_negocio WHERE activo=TRUE",
		);
		const activeP = await client.query(
			"SELECT id FROM tipo_profesional WHERE activo=TRUE",
		);
		const setN = new Set(activeN.rows.map((x) => +x.id)),
			setP = new Set(activeP.rows.map((x) => +x.id));
		for (const [, id] of negocios)
			if (!setN.has(id))
				throw new Error(`tipo_negocio ${id} inactivo o inexistente.`);
		for (const id of tiposProf)
			if (!setP.has(id))
				throw new Error(`tipo_profesional ${id} inactivo o inexistente.`);
		const occupied = await client.query(
			"SELECT telefono FROM usuario WHERE telefono BETWEEN $1 AND $2 UNION SELECT telefono FROM persona WHERE telefono BETWEEN $1 AND $2",
			[String(PHONE_BASE), String(PHONE_BASE + 999)],
		);
		if (occupied.rows.length)
			throw new Error("El rango telefónico 70000000–70000999 ya está ocupado.");
		const hash = await bcrypt.hash(PASSWORD, 10);
		let pIndex = 0;
		for (let i = 0; i < 50; i++) {
			const [base, tipoId] = negocios[i],
				[depto, municipio] = ciudades[i],
				zona = pick(zonas[depto], i, 3);
			const businessName = `${base} ${i + 1}`;
			const b = await client.query(
				`INSERT INTO negocio(tipo_negocio_id,slug,codigo,nombre,descripcion,telefono,departamento,municipio,zona,direccion,eslogan,informacion,recomendacion,estado)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'HABILITADO') RETURNING id`,
				[
					tipoId,
					`demo-pia-${slug(base)}-${String(i + 1).padStart(2, "0")}`,
					`DEMO-PIA-${String(i + 1).padStart(3, "0")}`,
					businessName,
					`Espacio de belleza y cuidado personal especializado en ${base}.`,
					`4${String(1000000 + i).slice(-6)}`,
					depto,
					municipio,
					zona,
					`Av. ${["América", "Melchor Pérez", "Ballivián", "Arce", "Libertador"][i % 5]}, ${zona}`,
					"Tu espacio de belleza y cuidado personal",
					"Atención personalizada con reserva previa.",
					"Se recomienda reservar con anticipación.",
				],
			);
			totals.negocios++;
			const businessId = b.rows[0].id;
			const professionalsCount = i < 20 ? 3 : 2;
			for (let j = 0; j < professionalsCount; j++) {
				const idx = pIndex++,
					fullName = `${pick(nombres, idx, 7)} ${pick(apellidos, idx, 5)} ${pick(apellidos, idx, 3)}`;
				const phone = String(PHONE_BASE + idx),
					proSlug = `demo-pia-prof-${String(idx + 1).padStart(3, "0")}-${slug(fullName)}`;
				const persona = await client.query(
					"INSERT INTO persona(nombre,telefono,sexo) VALUES($1,$2,$3) RETURNING id",
					[fullName, phone, idx % 5 === 0 ? "MASCULINO" : "FEMENINO"],
				);
				const personaId = persona.rows[0].id;
				await client.query(
					"INSERT INTO usuario(persona_id,rol_id,telefono,password,estado) VALUES($1,$2,$3,$4,'HABILITADO')",
					[personaId, ADMIN_ID, phone, hash],
				);
				const pro = await client.query(
					`INSERT INTO profesional(persona_id,slug,fecha_trabajo,descripcion,lema,estado,estado_funciones)
      VALUES($1,$2,CURRENT_DATE-(($3%1800)::int),$4,$5,'ACTIVO','HABILITADO') RETURNING id`,
					[
						personaId,
						proSlug,
						idx,
						`${fullName} ofrece técnicas actuales y asesoramiento personalizado.`,
						"Belleza, estilo y confianza.",
					],
				);
				const proId = pro.rows[0].id;
				totals.profesionales++;
				await client.query(
					"INSERT INTO profesional_tipo_profesional(profesional_id,tipo_profesional_id) VALUES($1,$2)",
					[proId, pick(tiposProf, idx, 7)],
				);
				const link = await client.query(
					"INSERT INTO profesional_negocio(negocio_id,profesional_id,acceso,estado) VALUES($1,$2,'ACEPTADO','HABILITADO') RETURNING id",
					[businessId, proId],
				);
				const membership = await client.query(
					"INSERT INTO membresia(profesional_negocio_id,fecha_inicio,fecha_fin,monto,estado_pagado,estado) VALUES($1,CURRENT_DATE,(CURRENT_DATE+INTERVAL '1 month')::date,5,TRUE,'ACTIVO') RETURNING id",
					[link.rows[0].id],
				);
				totals.membresias++;
				await client.query(
					"INSERT INTO pago(metodo_pago_id,profesional_id,membresia_id,numero,fecha,hora,monto,estado) VALUES($1,$2,$3,$4,CURRENT_DATE,LOCALTIME,$5,'ACTIVO')",
					[
						QR_ID,
						proId,
						membership.rows[0].id,
						`DEMO-MEM-${String(idx + 1).padStart(6, "0")}`,
						5,
					],
				);
				totals.pagos++;
				for (let k = 0; k < 3; k++) {
					const [serviceName, description, duration, price] = pick(
						servicios,
						idx * 3 + k,
						11,
					);
					await client.query(
						"INSERT INTO servicio(profesional_id,nombre,descripcion,duracion,precio,estado) VALUES($1,$2,$3,$4,$5,'HABILITADO')",
						[
							proId,
							serviceName,
							`${description}. Disponible en ${businessName}.`,
							duration,
							price + ((idx + k) % 5) * 5,
						],
					);
					totals.servicios++;
				}
			}
		}
		await client.query("COMMIT");
		console.log("CARGA DEMO COMPLETADA", totals);
		console.log("Accesos: teléfonos 70000000 a 70000119");
		console.log("Contraseña: la configurada en PIA_DEMO_PASSWORD");
		console.log("Negocios: DEMO-PIA-001 a DEMO-PIA-050");
	} catch (e) {
		await client.query("ROLLBACK");
		console.error("Carga revertida:", e.message);
		process.exitCode = 1;
	} finally {
		client.release();
		await pool.end();
	}
}
main().catch(async (e) => {
	console.error(e);
	await pool.end();
	process.exit(1);
});
