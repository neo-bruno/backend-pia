const service = require('./profesionalnegocio.service')

const getProfessionalBusiness = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const resultado = await service.getProfessionalBusiness(profesionalId);

    return res.status(200).json({
      ok: true,
      message: "Profesionales del negocio obtenidos correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfessionalBusiness,
}