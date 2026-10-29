const service = require("./reprogramacion.service");

function obtenerToken(req) {
	const authorization = req.headers.authorization;
	const bearer = authorization?.startsWith("Bearer ")
		? authorization.slice(7).trim()
		: null;

	return bearer || req.headers["x-cliente-token"] || null;
}

function responderError(res, error) {
	const status = Number(error.statusCode) || 500;
	if (status >= 500) console.error("Error en reprogramación:", error);
	return res.status(status).json({
		ok: false,
		mensaje:
			status >= 500
				? "Ocurrió un error al procesar la reprogramación."
				: error.message,
		codigo: error.code || "ERROR_REPROGRAMACION",
	});
}

async function getCondiciones(req, res) {
	try {
		const token = obtenerToken(req);
		const data = await service.getCondiciones({
			token,
			reservaId: req.params.reservaId,
		});
		return res.json({ ok: true, data });
	} catch (error) {
		return responderError(res, error);
	}
}

async function getDisponibilidad(req, res) {
	try {
		const token = obtenerToken(req);
		const data = await service.getDisponibilidad({
			token,
			reservaId: req.params.reservaId,
			fecha: req.query.fecha,
		});
		return res.json({ ok: true, data });
	} catch (error) {
		return responderError(res, error);
	}
}

async function confirmarReprogramacion(req, res) {
	try {
		const token = obtenerToken(req);
		const data = await service.confirmarReprogramacion({
			token,
			reservaId: req.body?.reservaId ?? req.body?.reserva_id,
			fecha: req.body?.fecha,
			slotsReserva: req.body?.slots_reserva ?? req.body?.slotsReserva,
		});
		return res.status(201).json({
			ok: true,
			mensaje: "La reserva se reprogramó correctamente.",
			data,
		});
	} catch (error) {
		return responderError(res, error);
	}
}

module.exports = { getCondiciones, getDisponibilidad, confirmarReprogramacion };
