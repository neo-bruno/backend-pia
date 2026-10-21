const service = require("./especialidad.service");

function obtenerUsuarioId(req) {
	return req.usuario?.usuario_id;
}

async function listar(req, res, next) {
	try {
		const data = await service.listar(obtenerUsuarioId(req));
		return res.status(200).json({ ok: true, data });
	} catch (error) {
		next(error);
	}
}

async function crear(req, res, next) {
	try {
		const data = await service.crear(obtenerUsuarioId(req), req.body);

		return res.status(201).json({
			ok: true,
			message: "Especialidad creada correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

async function actualizar(req, res, next) {
	try {
		const data = await service.actualizar(
			obtenerUsuarioId(req),
			req.params.id,
			req.body,
		);

		return res.status(200).json({
			ok: true,
			message: "Especialidad actualizada correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

async function cambiarEstado(req, res, next) {
	try {
		const data = await service.cambiarEstado(
			obtenerUsuarioId(req),
			req.params.id,
			req.body.estado,
		);

		return res.status(200).json({
			ok: true,
			message: "Estado de la especialidad actualizado.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

async function eliminar(req, res, next) {
	try {
		const data = await service.eliminar(obtenerUsuarioId(req), req.params.id);

		return res.status(200).json({
			ok: true,
			message: "Especialidad eliminada correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	listar,
	crear,
	actualizar,
	cambiarEstado,
	eliminar,
};
