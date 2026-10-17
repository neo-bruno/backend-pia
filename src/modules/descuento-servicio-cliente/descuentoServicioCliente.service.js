const pool = require("../../database/pool");
const repository = require("./descuentoServicioCliente.repository");
const validation = require("./descuentoServicioCliente.validation");

// ============================================================
// ERROR CONTROLADO
// ============================================================

const crearError = (
	mensaje,
	statusCode = 400,
	code = "ERROR_DESCUENTO_CLIENTE",
) => {
	const error = new Error(mensaje);
	error.statusCode = statusCode;
	error.code = code;
	return error;
};

// ============================================================
// VALIDAR CLIENTE
// ============================================================

const validarCliente = async (client, profesionalId, clienteId) => {
	const existe = await repository.existeClienteProfesional(
		client,
		profesionalId,
		clienteId,
	);

	if (!existe) {
		throw crearError(
			"El cliente no pertenece a la cartera de este profesional.",
			404,
			"CLIENTE_NO_ENCONTRADO",
		);
	}
};

// ============================================================
// LISTAR DESCUENTOS ASIGNABLES
// ============================================================

exports.listarDescuentosDisponibles = async (contexto, clienteIdParam) => {
	const { negocioId, profesionalId } = validation.validarContexto(contexto);

	const clienteId = validation.validarId(clienteIdParam, "Cliente");

	const client = await pool.connect();

	try {
		await validarCliente(client, profesionalId, clienteId);

		return await repository.listarDescuentosDisponibles(
			client,
			negocioId,
			profesionalId,
			clienteId,
		);
	} finally {
		client.release();
	}
};

// ============================================================
// ASIGNAR UNO O VARIOS DESCUENTOS AL CLIENTE
// ============================================================

exports.asignarDescuentos = async (
	contexto,
	clienteIdParam,
	descuentoServicioIds,
) => {
	const { negocioId, profesionalId } = validation.validarContexto(contexto);

	const clienteId = validation.validarId(clienteIdParam, "Cliente");

	const ids = descuentoServicioIds;

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		await validarCliente(client, profesionalId, clienteId);

		const asociaciones = await repository.obtenerAsociacionesAsignables(
			client,
			negocioId,
			profesionalId,
			ids,
		);

		if (asociaciones.length !== ids.length) {
			throw crearError(
				"Uno o más descuentos no existen, no pertenecen a tu perfil, no están vigentes o no son de tipo CLIENTE.",
				400,
				"DESCUENTOS_NO_ASIGNABLES",
			);
		}

		const existentes = await repository.obtenerAsignacionesExistentes(
			client,
			clienteId,
			ids,
		);

		if (existentes.length > 0) {
			throw crearError(
				"Uno o más descuentos ya fueron asignados o utilizados por este cliente. No se pueden asignar nuevamente.",
				409,
				"DESCUENTO_CLIENTE_DUPLICADO",
			);
		}

		const asignaciones = [];

		for (const descuentoServicioId of ids) {
			const asignacion = await repository.crearAsignacion(
				client,
				descuentoServicioId,
				clienteId,
			);

			asignaciones.push(asignacion);
		}

		await client.query("COMMIT");

		return {
			cliente_id: clienteId,
			total_asignados: asignaciones.length,
			asignaciones,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

exports.retirarAsignacion = async (contexto, asignacionIdParam) => {
	const { negocioId, profesionalId } = validation.validarContexto(contexto);

	const asignacionId = validation.validarAsignacionId(asignacionIdParam);

	const client = await pool.connect();
	let transaccionIniciada = false;

	try {
		await client.query("BEGIN");
		transaccionIniciada = true;

		const asignacion = await repository.obtenerAsignacionParaRetirar(
			client,
			negocioId,
			profesionalId,
			asignacionId,
		);

		if (!asignacion) {
			throw crearError(
				"No se encontró la asignación para este profesional.",
				404,
				"ASIGNACION_NO_ENCONTRADA",
			);
		}

		if (asignacion.estado_asignacion !== "ACTIVO") {
			throw crearError(
				"Esta asignación ya fue retirada.",
				409,
				"ASIGNACION_INACTIVA",
			);
		}

		const tieneUso =
			asignacion.fecha_aplicada != null ||
			asignacion.hora_aplicada != null ||
			asignacion.codigo_aplicado != null ||
			asignacion.monto_aplicado != null ||
			asignacion.estado_aplicado != null;

		if (tieneUso) {
			throw crearError(
				"No se puede retirar una asignación que ya fue utilizada.",
				409,
				"ASIGNACION_UTILIZADA",
			);
		}

		const retirada = await repository.retirarAsignacion(client, asignacionId);

		if (!retirada) {
			throw crearError(
				"No fue posible retirar la asignación. Verifica su estado.",
				409,
				"ASIGNACION_NO_RETIRADA",
			);
		}

		await client.query("COMMIT");
		transaccionIniciada = false;

		return {
			asignacion: retirada,
			mensaje: "Asignación retirada correctamente.",
		};
	} catch (error) {
		if (transaccionIniciada) {
			await client.query("ROLLBACK");
		}

		throw error;
	} finally {
		client.release();
	}
};
