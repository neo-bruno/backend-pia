const service = require("./descuentoServicioCliente.service");
const validation = require("./descuentoServicioCliente.validation");

// ============================================================
// CONTEXTO DEL USUARIO AUTENTICADO
// ============================================================

const obtenerContexto = (req) => ({
	negocioId: req.usuario?.negocio_id,
	profesionalId: req.usuario?.profesional_id,
});

// ============================================================
// LISTAR DESCUENTOS ASIGNABLES
// ============================================================

exports.listarDescuentosDisponibles = async (req, res, next) => {
	try {
		const data = await service.listarDescuentosDisponibles(
			obtenerContexto(req),
			req.params.clienteId,
		);

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		next(error);
	}
};

// ============================================================
// ASIGNAR DESCUENTOS
// ============================================================

exports.asignarDescuentos = async (req, res, next) => {
	try {
		const ids = validation.validarDescuentoServicioIds(req.body);

		const data = await service.asignarDescuentos(
			obtenerContexto(req),
			req.params.clienteId,
			ids,
		);

		return res.status(201).json({
			ok: true,
			mensaje: "Descuentos asignados correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
};

// ============================================================
// RETIRAR ASIGNACIÓN DE UN DESCUENTO
// ============================================================

exports.retirarAsignacion = async (req, res, next) => {
	try {
		const asignacionId = validation.validarAsignacionId(
			req.params.asignacionId,
		);

		const data = await service.retirarAsignacion(
			obtenerContexto(req),
			asignacionId,
		);

		return res.status(200).json({
			ok: true,
			mensaje: "La asignación del descuento fue retirada correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
};

exports.retirarAsignacion = async (req, res, next) => {
	try {
		const data = await service.retirarAsignacion(
			obtenerContexto(req),
			req.params.asignacionId,
		);

		return res.status(200).json({
			ok: true,
			mensaje: data.mensaje,
			data: data.asignacion,
		});
	} catch (error) {
		next(error);
	}
};
