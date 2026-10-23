export class AccountCreationFailedError extends Error {
  constructor(cause: string) {
    super(`Impossible de créer le compte : ${cause}`);
    this.name = "AccountCreationFailedError";
  }
}

export class AuthenticationFailedError extends Error {
  constructor(cause: string) {
    super(`Authentification échouée : ${cause}`);
    this.name = "AuthenticationFailedError";
  }
}

export class TokenValidationFailedError extends Error {
  constructor() {
    super("Token invalide ou expiré");
    this.name = "TokenValidationFailedError";
  }
}
