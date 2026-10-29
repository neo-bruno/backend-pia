const pool = require("../../database/pool");
const repository = require("./favorito.repository");

// ============================================================
// CREAR FAVORITO
// ============================================================

async function crearFavorito({ token, tipo, id }) {
	const client = await pool.connect();

	try {
		if (!token) {
			const error = new Error("El cliente no está autenticado.");

			error.status = 401;
			error.code = "CLIENTE_NO_AUTENTICADO";

			throw error;
		}

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			const error = new Error("El token del cliente no es válido.");

			error.status = 401;
			error.code = "TOKEN_INVALIDO";

			throw error;
		}

		const objeto = await repository.verificarObjeto(client, tipo, id);

		if (!objeto) {
			const error = new Error(`El ${tipo.toLowerCase()} indicado no existe.`);

			error.status = 404;
			error.code = "OBJETO_NO_ENCONTRADO";

			throw error;
		}

		const favorito = await repository.crearFavorito(
			client,
			Number(cliente.id),
			tipo,
			id,
		);

		return {
			es_favorito: true,
			favorito,
		};
	} finally {
		client.release();
	}
}

// ============================================================
// ELIMINAR FAVORITO
// ============================================================

async function eliminarFavorito({ token, tipo, id }) {
	const client = await pool.connect();

	try {
		if (!token) {
			const error = new Error("El cliente no está autenticado.");

			error.status = 401;
			error.code = "CLIENTE_NO_AUTENTICADO";

			throw error;
		}

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			const error = new Error("El token del cliente no es válido.");

			error.status = 401;
			error.code = "TOKEN_INVALIDO";

			throw error;
		}

		const favorito = await repository.eliminarFavorito(
			client,
			Number(cliente.id),
			tipo,
			id,
		);

		if (!favorito) {
			const error = new Error("El favorito no existe.");

			error.status = 404;
			error.code = "FAVORITO_NO_ENCONTRADO";

			throw error;
		}

		return {
			es_favorito: false,
			favorito,
		};
	} finally {
		client.release();
	}
}

// ============================================================
// OBTENER FAVORITOS
// ============================================================

async function obtenerFavoritos({ token }) {
	const client = await pool.connect();

	try {
		if (!token) {
			const error = new Error("El cliente no está autenticado.");

			error.status = 401;
			error.code = "CLIENTE_NO_AUTENTICADO";

			throw error;
		}

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			const error = new Error("El token del cliente no es válido.");

			error.status = 401;
			error.code = "TOKEN_INVALIDO";

			throw error;
		}

		const favoritos = await repository.obtenerFavoritosCliente(
			client,
			Number(cliente.id),
		);

		const negocios = [];
		const profesionales = [];
		const servicios = [];

		for (const favorito of favoritos) {
			if (favorito.tipo === "NEGOCIO") {
				negocios.push({
					favorito_id: favorito.favorito_id,
					created_at: favorito.created_at,

					// Identificación del negocio
					id: favorito.negocio_id,
					nombre: favorito.negocio_nombre,
					slug: favorito.negocio_slug,
					codigo: favorito.negocio_codigo,

					// Información
					descripcion: favorito.negocio_descripcion,
					telefono: favorito.negocio_telefono,
					departamento: favorito.negocio_departamento,
					municipio: favorito.negocio_municipio,
					zona: favorito.negocio_zona,
					direccion: favorito.negocio_direccion,
					latitud: favorito.negocio_latitud,
					longitud: favorito.negocio_longitud,

					// Imágenes
					logo: favorito.negocio_logo,
					portada: favorito.negocio_portada,
					imagen_portada:
						favorito.negocio_portada || favorito.negocio_logo || null,
					imagen: favorito.negocio_logo || favorito.negocio_portada || null,

					// Calificaciones
					rating:
						favorito.negocio_rating != null
							? Number(favorito.negocio_rating)
							: 0,

					resenas: Number(favorito.negocio_resenas) || 0,

					// Estado del favorito
					favorito: true,
				});
			}

			if (favorito.tipo === "PROFESIONAL") {
				profesionales.push({
					favorito_id: favorito.favorito_id,
					created_at: favorito.created_at,

					id: favorito.profesional_id,
					slug: favorito.profesional_slug,
					nombre: favorito.profesional_nombre,
					foto: favorito.profesional_foto,
					portada: favorito.profesional_portada,
					descripcion: favorito.profesional_descripcion,
					lema: favorito.profesional_lema,

					rating:
						favorito.profesional_rating != null
							? Number(favorito.profesional_rating)
							: 0,

					resenas: Number(favorito.profesional_resenas) || 0,

					precio:
						favorito.profesional_precio_minimo != null
							? "Bs. " + Number(favorito.profesional_precio_minimo)
							: null,

					favorito: true,
				});
			}

			if (favorito.tipo === "SERVICIO") {
				servicios.push({
					favorito_id: favorito.favorito_id,
					created_at: favorito.created_at,

					id: favorito.servicio_id,
					nombre: favorito.servicio_nombre,
					descripcion: favorito.servicio_descripcion,

					duracion: favorito.servicio_duracion,

					precio: favorito.servicio_precio,

					imagen: favorito.servicio_imagen,

					profesional: {
						id: favorito.profesional_id,
						slug: favorito.profesional_slug,
						nombre: favorito.profesional_nombre,
						foto: favorito.profesional_foto,
						portada: favorito.profesional_portada,
					},

					rating:
						favorito.servicio_rating != null
							? Number(favorito.servicio_rating)
							: 0,

					resenas: Number(favorito.servicio_resenas) || 0,

					favorito: true,
				});
			}
		}

		return {
			negocios,
			profesionales,
			servicios,
			total: negocios.length + profesionales.length + servicios.length,
		};
	} finally {
		client.release();
	}
}

// ============================================================
// ESTADO DE FAVORITO
// ============================================================

async function obtenerEstadoFavorito({ token, tipo, id }) {
	const client = await pool.connect();

	try {
		if (!token) {
			const error = new Error("El cliente no está autenticado.");

			error.status = 401;
			error.code = "CLIENTE_NO_AUTENTICADO";

			throw error;
		}

		const cliente = await repository.getClienteByToken(client, token);

		if (!cliente) {
			const error = new Error("El token del cliente no es válido.");

			error.status = 401;
			error.code = "TOKEN_INVALIDO";

			throw error;
		}

		return await repository.obtenerEstadoFavorito(
			client,
			Number(cliente.id),
			tipo,
			id,
		);
	} finally {
		client.release();
	}
}

module.exports = {
	crearFavorito,
	eliminarFavorito,
	obtenerFavoritos,
	obtenerEstadoFavorito,
};
