const service = require("./negocio.service");

const getBusiness = async (req, res, next) => {
	try {
		const negocio = await service.getBusiness();

		res.status(200).json({
			ok: true,
			data: negocio,
		});
	} catch (error) {
		next(error);
	}
};

const getBusinessBySlug = async (req, res, next) => {
	try {
		const { slug } = req.params;
		const data = await service.getBusinessBySlug(slug);

		if (!data) {
			return res.status(404).json({
				ok: false,
				message: "No se encontró el negocio solicitado.",
			});
		}

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		next(error);
	}
};

/******************************************************
 * REGISTRAR EL NEGOCIO Y PROFESIONAL
 ******************************************************/
function parseJson(value, campo) {
	if (!value) {
		throw new Error(`El campo ${campo} es obligatorio`);
	}

	if (typeof value === "object") {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch (error) {
		throw new Error(`El campo ${campo} no contiene un JSON válido`);
	}
}

async function saveBusinessProfession(req, res, next) {
	try {
		const negocio = parseJson(req.body.negocio, "negocio");
		const profesional = parseJson(req.body.profesional, "profesional");
		const membresia = parseJson(req.body.membresia, "membresia");

		const data = { negocio, profesional, membresia };

		const result = await service.saveBusinessProfession(data, req.file);

		return res.status(201).json({
			success: true,
			message:
				"El negocio y profesional fueron registrados correctamente. El comprobante quedó pendiente de validación.",
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	saveBusinessProfession,
	getBusiness,
	getBusinessBySlug,
};
