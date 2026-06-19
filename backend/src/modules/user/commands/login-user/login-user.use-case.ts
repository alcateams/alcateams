import { InvalidCredentialsError } from "../../domain/user.errors";
import { AuthenticationFailedError } from "../../../auth/auth.errors";
import type { User } from "../../domain/user.entity";
import type { UserRepositoryPort } from "../../database/user.repository.port";
import type { IdentityProvider } from "../../../auth/identity-provider.port";

interface LoginUserInput {
  email: string;
  password: string;
}

interface LoginUserResult {
  token: string;
  user: User;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserResult> {
    const token = await this.getToken(input.email, input.password);
    const user = await this.getUserFromDb(input.email);
    return { token, user };
  }

  private async getToken(email: string, password: string): Promise<string> {
    try {
      return await this.identityProvider.loginAndGetToken(email, password);
    } catch (error) {
      if (error instanceof AuthenticationFailedError) throw new InvalidCredentialsError();
      throw error;
    }
  }

  private async getUserFromDb(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new InvalidCredentialsError();
    return user;
  }
}
