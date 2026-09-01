const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema(req);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validate,
};
