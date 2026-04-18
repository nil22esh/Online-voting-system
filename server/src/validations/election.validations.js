import joi from "joi";

export const createElectionValidation = joi.object({
  title: joi.string().min(3).max(255).required().messages({
    "string.empty": "Election title is required",
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title must be at most 255 characters",
  }),
  description: joi.string().max(2000).allow("", null).messages({
    "string.max": "Description must be at most 2000 characters",
  }),
  start_time: joi.date().iso().required().messages({
    "date.base": "Start time must be a valid date",
    "any.required": "Start time is required",
  }),
  end_time: joi.date().iso().greater(joi.ref("start_time")).required().messages({
    "date.base": "End time must be a valid date",
    "date.greater": "End time must be after start time",
    "any.required": "End time is required",
  }),
  status: joi.string().valid("upcoming", "active", "completed", "cancelled").messages({
    "any.only": "Status must be upcoming, active, completed, or cancelled",
  }),
  is_anonymous: joi.boolean().default(false),
  election_level: joi.string().valid("national", "state", "local").default("local"),
  results_published: joi.boolean().default(false),
});

export const updateElectionValidation = joi.object({
  title: joi.string().min(3).max(255).messages({
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title must be at most 255 characters",
  }),
  description: joi.string().max(2000).allow("", null),
  start_time: joi.date().iso(),
  end_time: joi.date().iso(),
  status: joi.string().valid("upcoming", "active", "completed", "cancelled"),
  is_anonymous: joi.boolean(),
  election_level: joi.string().valid("national", "state", "local"),
  results_published: joi.boolean(),
});
