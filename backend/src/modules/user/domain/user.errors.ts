export class UserAlreadyExistsError extends Error {
  constructor() {
    super("Un compte avec cet email existe déjà");
    this.name = "UserAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email ou mot de passe incorrect");
    this.name = "InvalidCredentialsError";
  }
}
