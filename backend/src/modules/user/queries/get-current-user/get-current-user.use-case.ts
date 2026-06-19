import { TokenValidationFailedError } from "../../../auth/auth.errors";
import type { User } from "../../domain/user.entity";
import type { UserRepositoryPort } from "../../database/user.repository.port";
import type { IdentityProvider } from "../../../auth/identity-provider.port";

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(token: string): Promise<User> {
    const identityId = await this.identityProvider.validateToken(token);
    const user = await this.userRepository.findById(identityId);
    if (!user) throw new TokenValidationFailedError();
    return user;
  }
}
