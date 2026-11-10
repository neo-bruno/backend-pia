// ============================================================
// PIA - MÓDULO DASHBOARD
// Capa: service
// ============================================================

const repository = require("./dashboard.repository");

const crearError = (mensaje, status = 400) => {
	const error = new Error(mensaje);
	error.status = status;
	return error;
};

// ============================================================
// OBTENER DASHBOARD
// ============================================================

const obtenerDashboard = async (profesionalId, fecha) => {
	const id = Number(profesionalId);

	if (!Number.isSafeInteger(id) || id <= 0) {
		throw crearError("No se pudo determinar el profesional autenticado.", 401);
	}
	
	if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
		throw crearError("La fecha seleccionada no es válida.", 400);
	}

	const [anio, mes, dia] = fecha.split("-").map(Number);
	const fechaValida = new Date(Date.UTC(anio, mes - 1, dia));

	if (fechaValida.getUTCFullYear() !== anio || fechaValida.getUTCMonth() + 1 !== mes || fechaValida.getUTCDate() !== dia) {
		throw crearError("La fecha seleccionada no es válida.", 400);
	}

	const resultado = await repository.getDashboard(id, fecha);

	return resultado;
};

module.exports = {
	obtenerDashboard,
};
