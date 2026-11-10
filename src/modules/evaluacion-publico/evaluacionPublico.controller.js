const service = require("./evaluacionPublico.service");

async function getEvaluacionParaCliente(req, res) {
	try {
		const token = req.headers["x-cliente-token"];
		const { id } = req.params;
		const { reserva_id } = req.query;

		const evaluacion = await service.getEvaluacionParaCliente({
			token,
			id,
			reservaId: reserva_id,
		});

		return res.status(200).json({
			ok: true,
			data: evaluacion,
		});
	} catch (error) {
		console.error("Error al consultar evaluación pública:", error.message);

		return res.status(error.status || 500).json({
			ok: false,
			codigo: error.codigo || "ERROR_INTERNO",
			mensaje:
				error.status && error.status < 500
					? error.message
					: "Ocurrió un error al consultar la evaluación.",
		});
	}
}

module.exports = {
	getEvaluacionParaCliente,
};
