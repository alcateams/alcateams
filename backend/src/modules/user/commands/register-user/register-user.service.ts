import { UserAlreadyExistsError } from "../../domain/user.errors";
import { User } from "../../domain/user.entity";
import type { UserRepositoryPort } from "../../database/user.repository.port";
import type { IdentityProvider } from "../../../auth/identity-provider.port";

interface RegisterUserInput {
  email: string;
  password: string;
  pseudo: string;
}

interface RegisterUserResult {
  token: string;
  user: User;
}

export class RegisterUserService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    await this.ensureEmailIsAvailable(input.email);

    const identityId = await this.identityProvider.createAccount(
      input.email,
      input.password,
      input.pseudo,
    );

    const newUser = User.create({
      id: identityId,
      email: input.email,
      pseudo: input.pseudo,
    });
    const user = await this.userRepository.saveUser(newUser);

    const token = await this.identityProvider.loginAndGetToken(input.email, input.password);

    return { token, user };
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const isAvailable = await this.identityProvider.isEmailAvailable(email);
    if (!isAvailable) throw new UserAlreadyExistsError();
  }
}
