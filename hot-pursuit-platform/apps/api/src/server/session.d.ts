import "express-session";

/**
 * Augment the express-session SessionData with the fields the HOT PURSUIT API
 * stores. Only the authenticated User id and the OAuth state nonce are kept in
 * the session — never secrets, role, permissions or the Discord token.
 */
declare module "express-session" {
  interface SessionData {
    /** The authenticated User id (server-side identity). */
    userId?: string;
    /** OAuth CSRF state nonce set before redirecting to Discord. */
    oauthState?: string;
    /** Where to send the user after login completes. */
    redirectTo?: string;
  }
}
