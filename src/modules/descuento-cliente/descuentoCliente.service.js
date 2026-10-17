const repository = require("./descuentoCliente.repository");

// =====================================================
// OBTENER DESCUENTOS DEL CLIENTE
// =====================================================

const getMisDescuentos = async (token) => {
	if (!token) {
		const error = new Error("Token de cliente no proporcionado");
		error.status = 401;
		throw error;
	}

	const cliente = await repository.getClienteByToken(token);

	if (!cliente) {
		const error = new Error("Sesión de cliente no válida");
		error.status = 401;
		throw error;
	}

	const descuentos = await repository.getDescuentosByClienteId(cliente.id);

	return {
		total: descuentos.length,

		disponibles: descuentos.filter((d) => d.categoria === "DISPONIBLE"),

		utilizados: descuentos.filter((d) => d.categoria === "UTILIZADO"),

		vencidos: descuentos.filter((d) => d.categoria === "VENCIDO"),

		pendientes: descuentos.filter((d) => d.categoria === "PENDIENTE"),

		descuentos,
	};
};

const getDescuentosDelProfesional = async (token, profesionalId) => {
	if (!token) {
		const error = new Error("Token de cliente no proporcionado");
		error.status = 401;
		throw error;
	}

	const idProfesional = Number(profesionalId);

	if (!Number.isInteger(idProfesional) || idProfesional <= 0) {
		const error = new Error("Profesional no válido");
		error.status = 400;
		throw error;
	}

	const cliente = await repository.getClienteByToken(token);

	if (!cliente) {
		const error = new Error("Sesión de cliente no válida");
		error.status = 401;
		throw error;
	}

	const descuentos = await repository.getDescuentosByClienteYProfesional(
		cliente.id,
		idProfesional,
	);

	return {
		total: descuentos.length,
		descuentos,
	};
};

// =====================================================
// VERIFICAR DESCUENTOS DISPONIBLES PARA UN SERVICIO
// =====================================================

const verificarDescuentosPorServicio = async (token, servicioId) => {
	if (!token) {
		const error = new Error("Token de cliente no proporcionado");
		error.status = 401;
		throw error;
	}

	const idServicio = Number(servicioId);

	if (!Number.isInteger(idServicio) || idServicio <= 0) {
		const error = new Error("Servicio no válido");
		error.status = 400;
		throw error;
	}

	const cliente = await repository.getClienteByToken(token);

	if (!cliente) {
		const error = new Error("Sesión de cliente no válida");
		error.status = 401;
		throw error;
	}

	const disponible = await repository.getDescuentosDisponiblesPorServicio(
		cliente.id,
		idServicio,
	);

	return {
		servicio_id: idServicio,
		tiene_descuento_disponible: disponible,
	};
};

const validarCodigoDescuento = async (token, codigo, servicioId) => {
	if (!token) {
		const error = new Error("Debes iniciar sesión como cliente.");
		error.status = 401;
		throw error;
	}

	const codigoLimpio = String(codigo || "").trim();
	const idServicio = Number(servicioId);

	if (!codigoLimpio) {
		const error = new Error("Ingresa un código de descuento.");
		error.status = 400;
		throw error;
	}

	if (!Number.isInteger(idServicio) || idServicio <= 0) {
		const error = new Error("El servicio seleccionado no es válido.");
		error.status = 400;
		throw error;
	}

	const cliente = await repository.getClienteByToken(token);

	if (!cliente) {
		const error = new Error("La sesión del cliente no es válida.");
		error.status = 401;
		throw error;
	}

	const descuento = await repository.validarCodigoDescuento(
		codigoLimpio,
		idServicio,
		cliente.id,
	);

	if (!descuento) {
		const error = new Error(
			"El código no es válido para este servicio, no está vigente o ya fue utilizado.",
		);
		error.status = 400;
		throw error;
	}

	const precioOriginal = Number(descuento.servicio_precio || 0);
	const montoFijo = descuento.monto == null ? null : Number(descuento.monto);
	const porcentaje =
		descuento.porcentaje == null ? null : Number(descuento.porcentaje);

	if (
		precioOriginal < 0 ||
		(montoFijo !== null && montoFijo < 0) ||
		(porcentaje !== null && (porcentaje < 0 || porcentaje > 100)) ||
		(montoFijo === null && porcentaje === null) ||
		(montoFijo !== null && porcentaje !== null)
	) {
		const error = new Error("La configuración del descuento no es válida.");
		error.status = 400;
		throw error;
	}

	const calculo =
		montoFijo !== null ? montoFijo : (precioOriginal * porcentaje) / 100;

	const montoDescuento =
		Math.round(Math.min(precioOriginal, calculo) * 100) / 100;

	return {
		valido: true,
		codigo: descuento.codigo,
		descuento_id: descuento.descuento_id,
		asignacion_id: descuento.asignacion_id,
		tipo_descuento: descuento.tipo_descuento,
		servicio_id: descuento.servicio_id,
		servicio_nombre: descuento.servicio_nombre,
		precio_original: precioOriginal,
		monto_descuento: montoDescuento,
		precio_aplicable: Math.round((precioOriginal - montoDescuento) * 100) / 100,
	};
};

module.exports = {
	getMisDescuentos,
	getDescuentosDelProfesional,
	verificarDescuentosPorServicio,
  validarCodigoDescuento,
};
