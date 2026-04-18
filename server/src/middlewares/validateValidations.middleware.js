import { validationErrorResponse } from "../utils/response.js";

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false }); // collect all errors

  if (error) {
    const errors = error.details.map((err) => err.message); // extract messages
    return validationErrorResponse(res, "Validation failed", errors);
  }

  next(); // proceed if valid
};

export default validate;
