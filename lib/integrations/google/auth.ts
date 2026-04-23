/**
 * Google OAuth 2.0 helpers
 * Handles auth URL generation, code exchange, and token refresh.
 */

import { google } from "googleapis"

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
]

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/**
 * Generate the Google consent screen URL.
 * state param carries the user ID so we know who to link tokens to.
 */
export function getGoogleAuthUrl(userId: string): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: userId,
  })
}

/**
 * Exchange the authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)
  return tokens
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(refreshToken: string) {
  const client = getOAuth2Client()
  client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await client.refreshAccessToken()
  return credentials
}

/**
 * Get an authenticated OAuth2 client ready to call Google APIs.
 */
export function getAuthenticatedClient(accessToken: string, refreshToken: string) {
  const client = getOAuth2Client()
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return client
}

/**
 * Get the email address of the authenticated Google user.
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string | null> {
  const client = getOAuth2Client()
  client.setCredentials({ access_token: accessToken })

  const oauth2 = google.oauth2({ version: "v2", auth: client })
  const { data } = await oauth2.userinfo.get()
  return data.email || null
}

/**
 * Revoke the Google tokens (used on disconnect).
 */
export async function revokeGoogleToken(token: string) {
  const client = getOAuth2Client()
  await client.revokeToken(token)
}

export { SCOPES }
