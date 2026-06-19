import crypto from "crypto";
import { jwtDecode } from "jwt-decode";
import { rainbowConfig } from "../../config/rainbow.config";
import {
  AccountCreationFailedError,
  AuthenticationFailedError,
  TokenValidationFailedError,
} from "./auth.errors";
import type { IdentityProvider } from "./identity-provider.port";

type RainbowUser = { id: string };
type RainbowUserListResponse = { data: RainbowUser[] };
type RainbowCreatedUserResponse = { data: RainbowUser };
type RainbowSessionResponse = { token: string };
type RainbowTokenPayload = { user: { id: string }; exp?: number };
type RainbowErrorResponse = { errorDetails: string | { msg: string }[] };

// Renew the cached admin token this many milliseconds before its real expiry.
const ADMIN_TOKEN_EXPIRY_MARGIN_MS = 60_000;

export class RainbowIdentityProvider implements IdentityProvider {
  private cachedAdminToken: { token: string; expiresAt: number } | null = null;

  async isEmailAvailable(email: string): Promise<boolean> {
    const adminToken = await this.getAdminToken();

    const response = await fetch(
      `${rainbowConfig.host}/api/rainbow/admin/v1.0/users?format=mini&loginEmail=${encodeURIComponent(email)}`,
      { headers: this.adminHeaders(adminToken) },
    );

    if (!response.ok) {
      throw new AuthenticationFailedError(await this.readErrorMessage(response));
    }

    const existingUsers = (await response.json()) as RainbowUserListResponse;
    return existingUsers.data.length === 0;
  }

  async createAccount(email: string, password: string, pseudo: string): Promise<string> {
    const adminToken = await this.getAdminToken();

    const response = await fetch(`${rainbowConfig.host}/api/rainbow/admin/v1.0/users`, {
      method: "POST",
      headers: { ...this.adminHeaders(adminToken), "Content-Type": "application/json" },
      body: JSON.stringify({ loginEmail: email, password, firstName: pseudo }),
    });

    if (!response.ok) {
      throw new AccountCreationFailedError(await this.readErrorMessage(response));
    }

    const createdUser = (await response.json()) as RainbowCreatedUserResponse;
    return createdUser.data.id;
  }

  async deleteAccount(identityId: string): Promise<void> {
    const adminToken = await this.getAdminToken();

    const response = await fetch(
      `${rainbowConfig.host}/api/rainbow/admin/v1.0/users/${encodeURIComponent(identityId)}`,
      { method: "DELETE", headers: this.adminHeaders(adminToken) },
    );

    if (!response.ok) {
      throw new AccountCreationFailedError(await this.readErrorMessage(response));
    }
  }

  async loginAndGetToken(email: string, password: string): Promise<string> {
    const response = await fetch(`${rainbowConfig.host}/api/rainbow/authentication/v1.0/login`, {
      headers: {
        Authorization: this.buildBasicAuthHeader(email, password),
        "x-rainbow-app-auth": this.buildAppAuthHeader(password),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new AuthenticationFailedError(await this.readErrorMessage(response));
    }

    const session = (await response.json()) as RainbowSessionResponse;
    return session.token;
  }

  async validateToken(token: string): Promise<string> {
    const response = await fetch(
      `${rainbowConfig.host}/api/rainbow/authentication/v1.0/validator`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );

    if (!response.ok) {
      throw new TokenValidationFailedError();
    }

    // The Rainbow validator endpoint above is what authenticates the token (signature + expiry).
    // Only once it has succeeded do we decode the payload locally to read the user id.
    // `jwtDecode` does NOT verify the signature, so this decode must never replace the call above.
    const tokenPayload = jwtDecode<RainbowTokenPayload>(token);
    return tokenPayload.user.id;
  }

  /**
   * Returns a valid admin token, reusing the cached one until shortly before it expires.
   * Avoids re-authenticating against Rainbow on every admin operation.
   */
  private async getAdminToken(): Promise<string> {
    if (this.cachedAdminToken && this.cachedAdminToken.expiresAt > Date.now()) {
      return this.cachedAdminToken.token;
    }

    const token = await this.loginAndGetToken(
      rainbowConfig.adminEmail,
      rainbowConfig.adminPassword,
    );
    this.cachedAdminToken = { token, expiresAt: this.resolveExpiry(token) };
    return token;
  }

  private resolveExpiry(token: string): number {
    const { exp } = jwtDecode<RainbowTokenPayload>(token);
    // `exp` is a Unix timestamp in seconds; fall back to an immediate refresh if absent.
    if (!exp) return 0;
    return exp * 1000 - ADMIN_TOKEN_EXPIRY_MARGIN_MS;
  }

  private adminHeaders(adminToken: string) {
    return {
      Authorization: `Bearer ${adminToken}`,
      Accept: "application/json",
    };
  }

  private async readErrorMessage(response: Response): Promise<string> {
    const error = (await response.json()) as RainbowErrorResponse;

    if (typeof error.errorDetails === "string") {
      return error.errorDetails;
    }

    return error.errorDetails.map((detail) => detail.msg).join(", ");
  }

  private buildBasicAuthHeader(email: string, password: string): string {
    const credentials = `${email}:${password}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  private buildAppAuthHeader(password: string): string {
    // Rainbow's app-auth scheme: SHA-256 of (appSecret + password).
    const secretHash = crypto
      .createHash("sha256")
      .update(rainbowConfig.appSecret + password)
      .digest("hex");

    const credentials = `${rainbowConfig.appId}:${secretHash}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }
}
