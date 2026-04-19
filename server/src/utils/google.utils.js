import { OAuth2Client } from "google-auth-library";
import config from "../config/config.js";

const oauth2Client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

/**
 * Generate the Google OAuth consent screen URL
 */
export const getGoogleAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "select_account", // Always show account picker
  });
};

/**
 * Exchange authorization code for Google tokens
 * @param {string} code - The authorization code from Google callback
 */
export const exchangeCodeForTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

/**
 * Get the authenticated user's Google profile
 * @param {string} accessToken - Google access token
 */
export const getGoogleProfile = async (accessToken) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google profile");
  }

  return response.json();
};
