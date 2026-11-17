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

		// Prioridad geográfica: no excluye otros departamentos.
		departamentoPrioritario:
			filtros.departamentoPrioritario?.trim() || undefined,

		// Filtros exactos, solamente cuando se soliciten.
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

// =====================================================
// BÚSQUEDA INDEPENDIENTE DE NEGOCIOS
// =====================================================
const buscarNegocios = async (filtros = {}) => {
	return repository.buscarNegociosPublicados({
		pagina: filtros.pagina,
		limite: filtros.limite,
		departamento: filtros.departamento?.trim() || undefined,
		municipio: filtros.municipio?.trim() || undefined,
		tipoNegocioId: filtros.tipoNegocioId,
		buscar: filtros.buscar?.trim() || undefined,
	});
};

// =====================================================
// BÚSQUEDA INDEPENDIENTE DE SERVICIOS
// =====================================================
const buscarServicios = async (filtros = {}) => {
	return repository.buscarServiciosPublicados({
		pagina: filtros.pagina,
		limite: filtros.limite,

		// Mantener la misma prioridad que el listado público.
		departamentoPrioritario:
			filtros.departamentoPrioritario?.trim() || undefined,

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
// NEGOCIOS PÚBLICOS PARA EL MAPA
// Sin paginación
// =====================================================
const getNegociosParaMapa = async () => {
	return repository.getNegociosParaMapa();
};

module.exports = {
	getNegocios,
	getServicios,
	getServiciosConDescuentoPublico,
	buscarNegocios,
	buscarServicios,
	getNegociosParaMapa,
};
