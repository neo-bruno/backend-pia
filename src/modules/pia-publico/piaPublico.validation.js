const validarPaginacion = (req, res) => {
	const { pagina, limite } = req.query;

	if (pagina !== undefined) {
		const numeroPagina = Number(pagina);

		if (!Number.isInteger(numeroPagina) || numeroPagina < 1) {
			res.status(400).json({
				ok: false,
				mensaje: "La página debe ser un número entero mayor que cero",
			});

			return false;
		}
	}

	if (limite !== undefined) {
		const numeroLimite = Number(limite);

		if (
			!Number.isInteger(numeroLimite) ||
			numeroLimite < 1 ||
			numeroLimite > 50
		) {
			res.status(400).json({
				ok: false,
				mensaje: "El límite debe ser un entero entre 1 y 50",
			});

			return false;
		}
	}

	return true;
};

const validarFiltrosTexto = (req, res) => {
	const filtrosTexto = ["departamento", "municipio", "buscar"];

	for (const campo of filtrosTexto) {
		if (req.query[campo] !== undefined) {
			if (
				typeof req.query[campo] !== "string" ||
				req.query[campo].trim().length > 150
			) {
				res.status(400).json({
					ok: false,
					mensaje: `El filtro ${campo} no es válido`,
				});

				return false;
			}
		}
	}

	return true;
};

const validarIdPositivo = (req, res, campo, mensaje) => {
	const valor = req.query[campo];

	if (valor === undefined) {
		return true;
	}

	const id = Number(valor);

	if (!Number.isInteger(id) || id < 1) {
		res.status(400).json({
			ok: false,
			mensaje,
		});

		return false;
	}

	return true;
};

// =====================================================
// VALIDAR CONSULTA DE NEGOCIOS PÚBLICOS
// =====================================================
const validarConsultaNegocios = (req, res, next) => {
	if (!validarPaginacion(req, res)) return;
	if (!validarFiltrosTexto(req, res)) return;

	if (
		!validarIdPositivo(
			req,
			res,
			"tipoNegocioId",
			"El tipo de negocio debe ser un ID válido",
		)
	) {
		return;
	}

	next();
};

// =====================================================
// VALIDAR CONSULTA DE SERVICIOS PÚBLICOS
// =====================================================
const validarConsultaServicios = (req, res, next) => {
	if (!validarPaginacion(req, res)) return;
	if (!validarFiltrosTexto(req, res)) return;

	const ids = [
		{
			campo: "tipoNegocioId",
			mensaje: "El tipo de negocio debe ser un ID válido",
		},
		{
			campo: "negocioId",
			mensaje: "El negocio debe ser un ID válido",
		},
		{
			campo: "profesionalId",
			mensaje: "El profesional debe ser un ID válido",
		},
	];

	for (const { campo, mensaje } of ids) {
		if (!validarIdPositivo(req, res, campo, mensaje)) {
			return;
		}
	}

	// -------------------------------------------------
	// VALIDAR RANGO DE PRECIOS
	// -------------------------------------------------

	const validarPrecio = (campo, mensaje) => {
		const valor = req.query[campo];

		if (valor === undefined) {
			return true;
		}

		if (
			typeof valor !== "string" ||
			valor.trim() === "" ||
			!Number.isFinite(Number(valor)) ||
			Number(valor) < 0
		) {
			res.status(400).json({
				ok: false,
				mensaje,
			});

			return false;
		}

		return true;
	};

	if (
		!validarPrecio(
			"precioMin",
			"El precio mínimo debe ser un número mayor o igual a cero",
		)
	) {
		return;
	}

	if (
		!validarPrecio(
			"precioMax",
			"El precio máximo debe ser un número mayor o igual a cero",
		)
	) {
		return;
	}

	const precioMin = req.query.precioMin !== undefined ? Number(req.query.precioMin) : undefined;
	const precioMax = req.query.precioMax !== undefined ? Number(req.query.precioMax) : undefined;

	if (
		precioMin !== undefined &&
		precioMax !== undefined &&
		precioMin > precioMax
	) {
		return res.status(400).json({
			ok: false,
			mensaje: "El precio mínimo no puede superar al precio máximo",
		});
	}

	next();
};

module.exports = {
	validarConsultaNegocios,
	validarConsultaServicios,
};
