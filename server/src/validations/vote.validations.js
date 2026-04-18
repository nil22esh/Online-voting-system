import joi from "joi";

export const castVoteValidation = joi.object({
  election_id: joi.string().uuid().required().messages({
    "string.guid": "Election ID must be a valid UUID",
    "any.required": "Election ID is required",
  }),
  candidate_id: joi.string().uuid().required().messages({
    "string.guid": "Candidate ID must be a valid UUID",
    "any.required": "Candidate ID is required",
  }),
  otp_code: joi.string().length(6).required().messages({
    "string.length": "OTP code must be exactly 6 characters",
    "any.required": "OTP verification code is required",
  }),
});

export const requestOTPValidation = joi.object({
  phoneNumber: joi.string().min(10).max(15).required().messages({
    "string.min": "Phone number must be at least 10 digits",
    "string.max": "Phone number must not exceed 15 digits",
    "any.required": "Phone number is required",
  }),
});

