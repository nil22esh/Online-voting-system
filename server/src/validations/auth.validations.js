import joi from "joi";

export const registerValidations = joi.object({
  name: joi.string().min(3).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 50 characters long",
  }),
  email: joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: joi
    .string()
    .min(8)
    .max(128)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    )
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password must be at most 128 characters long",
      "string.pattern.base":
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
    }),
  phone_number: joi.string().pattern(/^\d{10}$/).required().messages({
    "string.empty": "Phone number is required",
    "string.pattern.base": "Phone number must be exactly 10 digits",
  }),
  aadhar_number: joi.string().pattern(/^\d{12}$/).required().messages({
    "string.empty": "Aadhar number is required",
    "string.pattern.base": "Aadhar number must be exactly 12 digits",
  }),
});

export const loginValidations = joi.object({
  email: joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});
