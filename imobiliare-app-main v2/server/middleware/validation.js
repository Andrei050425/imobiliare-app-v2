const Joi = require("joi");

const registerSchema = Joi.object({
  full_name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

// --- AICI ESTE MODIFICAREA ---
const propertySchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().allow("").optional(),
  price: Joi.number().positive().required(),
  area: Joi.number().positive().required(),
  address: Joi.string().required(),
  category_id: Joi.number().integer().required(),
  sector: Joi.string().allow("").optional(),
  status: Joi.string().valid("FREE", "RESERVED", "OCCUPIED", "MAINTENANCE").optional(),

  // ADAGĂ LINIA ASTA: Permitem câmpul 'image' să existe, de tip orice
  image: Joi.any().optional(),
});

const validateProperty = (req, res, next) => {
  // Putem adăuga și { allowUnknown: true } ca măsură de siguranță extra
  const { error } = propertySchema.validate(req.body, { allowUnknown: true });

  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { validateRegister, validateLogin, validateProperty };
