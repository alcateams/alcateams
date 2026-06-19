export class UserAlreadyExistsError extends Error {
  constructor() {
    super("Un compte avec cet email existe déjà");
    this.name = "UserAlreadyExistsError";
  }
}

export class PseudoAlreadyTakenError extends Error {
  constructor() {
    super("Ce pseudo est déjà utilisé");
    this.name = "PseudoAlreadyTakenError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email ou mot de passe incorrect");
    this.name = "InvalidCredentialsError";
  }
}
