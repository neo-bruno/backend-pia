const validarFiltros = (query = {}) => {
	const pagina = Number(query.pagina ?? 1);
	const limite = Number(query.limite ?? 20);

	// =====================================================
	// PAGINACIÓN
	// =====================================================

	if (!Number.isInteger(pagina) || pagina < 1) {
		throw crearError("La página debe ser un entero mayor que cero.");
	}

	if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
		throw crearError("El límite debe estar entre 1 y 100.");
	}

	// =====================================================
	// FECHAS
	// =====================================================

	const fechaDesde = query.fechaDesde || null;
	const fechaHasta = query.fechaHasta || null;

	const validarFecha = (fecha, campo) => {
		if (!fecha) return;

		if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
			throw crearError(`${campo} debe tener el formato YYYY-MM-DD.`);
		}

		const [anio, mes, dia] = fecha.split("-").map(Number);
		const comprobada = new Date(Date.UTC(anio, mes - 1, dia));

		if (
			comprobada.getUTCFullYear() !== anio ||
			comprobada.getUTCMonth() !== mes - 1 ||
			comprobada.getUTCDate() !== dia
		) {
			throw crearError(`${campo} no es una fecha válida.`);
		}
	};

	validarFecha(fechaDesde, "fechaDesde");
	validarFecha(fechaHasta, "fechaHasta");

	if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
		throw crearError(
			"La fecha inicial no puede ser posterior a la fecha final.",
		);
	}

	// =====================================================
	// ESTADO DE LA RESERVA
	// =====================================================

	const estadosPermitidos = [
		"PENDIENTE",
		"CONFIRMADA",
		"CANCELADA",
		"NO_ASISTIO",
		"COMPLETADA",
	];

	const estado = query.estado
		? String(query.estado).trim().toUpperCase()
		: null;

	if (estado && !estadosPermitidos.includes(estado)) {
		throw crearError("El estado de reserva no es válido.");
	}

	// =====================================================
	// VALIDAR IDENTIFICADORES
	// =====================================================

	const validarId = (valor, campo) => {
		if (valor === undefined || valor === null || valor === "") {
			return null;
		}

		const id = Number(valor);

		if (!Number.isSafeInteger(id) || id <= 0) {
			throw crearError(`${campo} indicado no es válido.`);
		}

		return id;
	};

	const negocioId = validarId(query.negocioId, "El negocio");
	const profesionalId = validarId(query.profesionalId, "El profesional");
	const servicioId = validarId(query.servicioId, "El servicio");

	// =====================================================
	// RESPUESTA NORMALIZADA
	// =====================================================

	return {
		pagina,
		limite,
		fechaDesde,
		fechaHasta,
		estado,
		negocioId,
		profesionalId,
		servicioId,

		busqueda:
			String(query.busqueda || "")
				.trim()
				.slice(0, 100) || null,
	};
};

// =====================================================
// ERROR DE VALIDACIÓN
// =====================================================

const crearError = (mensaje) => {
	const error = new Error(mensaje);
	error.status = 400;
	return error;
};

module.exports = {
	validarFiltros,
};
