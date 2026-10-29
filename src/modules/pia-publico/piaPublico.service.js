const repository = require("./piaPublico.repository");

// =====================================================
// NEGOCIOS PÚBLICOS
// =====================================================
const getNegocios = async (filtros = {}) => {
	return repository.getNegociosPublicados({
		pagina: filtros.pagina,
		limite: filtros.limite,
		departamento: filtros.departamento?.trim() || undefined,
		municipio: filtros.municipio?.trim() || undefined,
		tipoNegocioId: filtros.tipoNegocioId,
		buscar: filtros.buscar?.trim() || undefined,
	});
};

// =====================================================
// SERVICIOS PÚBLICOS
// =====================================================
const getServicios = async (filtros = {}) => {
	return repository.getServiciosPublicados({
		pagina: filtros.pagina,
		limite: filtros.limite,
		departamento: filtros.departamento?.trim() || undefined,
		municipio: filtros.municipio?.trim() || undefined,
		tipoNegocioId: filtros.tipoNegocioId,
		negocioId: filtros.negocioId,
		profesionalId: filtros.profesionalId,
		buscar: filtros.buscar?.trim() || undefined,
		precioMin: filtros.precioMin,
		precioMax: filtros.precioMax,
	});
};

// =====================================================
// SERVICIOS CON DESCUENTOS PÚBLICOS
// =====================================================
const getServiciosConDescuentoPublico = async () => {
	return repository.getServiciosConDescuentoPublico();
};

module.exports = {
	getNegocios,
	getServicios,
	getServiciosConDescuentoPublico,
};
