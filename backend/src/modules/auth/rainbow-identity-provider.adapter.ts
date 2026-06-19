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
type RainbowTokenPayload = { user: { id: string } };
type RainbowErrorResponse = { errorDetails: string | { msg: string }[] };

export class RainbowIdentityProvider implements IdentityProvider {
  async isEmailAvailable(email: string): Promise<boolean> {
    const adminToken = await this.loginAsAdmin();

    const response = await fetch(
      `${rainbowConfig.host}/api/rainbow/admin/v1.0/users?format=mini&loginEmail=${encodeURIComponent(email)}`,
      { headers: this.adminHeaders(adminToken) },
    );

    const existingUsers = (await response.json()) as RainbowUserListResponse;
    return existingUsers.data.length === 0;
  }

  async createAccount(email: string, password: string, pseudo: string): Promise<string> {
    const adminToken = await this.loginAsAdmin();

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

    const tokenPayload = jwtDecode<RainbowTokenPayload>(token);
    return tokenPayload.user.id;
  }

  private loginAsAdmin(): Promise<string> {
    return this.loginAndGetToken(rainbowConfig.adminEmail, rainbowConfig.adminPassword);
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
