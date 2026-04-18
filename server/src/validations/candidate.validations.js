import joi from "joi";

export const addCandidateValidation = joi.object({
  name: joi.string().min(2).max(100).required().messages({
    "string.empty": "Candidate name is required",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must be at most 100 characters",
  }),
  party_name: joi.string().max(100).allow("", null).messages({
    "string.max": "Party name must be at most 100 characters",
  }),
  party_symbol: joi.string().max(255).allow("", null),
  age: joi.number().integer().min(18).max(150).allow("", null),
  gender: joi.string().valid("Male", "Female", "Other", "").allow(null),
  education: joi.string().max(255).allow("", null),
  profession: joi.string().max(255).allow("", null),
  experience_years: joi.string().max(50).allow("", null),
  bio: joi.string().max(2000).allow("", null).messages({
    "string.max": "Bio must be at most 2000 characters",
  }),
  manifesto: joi.array().items(joi.string()).allow(null),
  social_links: joi.object({
    website: joi.string().uri().allow("", null),
    twitter: joi.string().uri().allow("", null),
    linkedin: joi.string().uri().allow("", null),
  }).allow(null),
  photo_url: joi.string().max(500).allow("", null).messages({
    "string.max": "Photo URL/path must be at most 500 characters",
  }),
  election_id: joi.string().uuid().required().messages({
    "string.guid": "Election ID must be a valid UUID",
    "any.required": "Election ID is required",
  }),
  photo: joi.any().optional(),
  party_symbol_file: joi.any().optional(),
});

export const updateCandidateValidation = joi.object({
  name: joi.string().min(2).max(100),
  party_name: joi.string().max(100).allow("", null),
  party_symbol: joi.string().max(255).allow("", null),
  age: joi.number().integer().min(18).max(150).allow("", null),
  gender: joi.string().valid("Male", "Female", "Other", "").allow(null),
  education: joi.string().max(255).allow("", null),
  profession: joi.string().max(255).allow("", null),
  experience_years: joi.string().max(50).allow("", null),
  bio: joi.string().max(2000).allow("", null),
  manifesto: joi.array().items(joi.string()).allow(null),
  social_links: joi.object({
    website: joi.string().uri().allow("", null),
    twitter: joi.string().uri().allow("", null),
    linkedin: joi.string().uri().allow("", null),
  }).allow(null),
  photo_url: joi.string().max(500).allow("", null),
  photo: joi.any().optional(),
  party_symbol_file: joi.any().optional(),
});
