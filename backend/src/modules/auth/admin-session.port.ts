export interface AdminSession {
  token: string;
  /** The admin account's identity id, e.g. to grant it rights on resources other users own. */
  userId: string;
}

/** Gives server-side code a session for the platform's admin account. */
export interface AdminSessionPort {
  getAdminSession(): Promise<AdminSession>;
}
