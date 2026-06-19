import type { User } from "../../domain/user.entity";
import { UserNotFoundError } from "../../domain/user.errors";
import type { UserRepositoryPort } from "../../database/user.repository.port";

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  // Token validation happens upstream in the `requireAuth` middleware; this use case
  // only resolves the already-authenticated identity id to its local user record.
  async execute(identityId: string): Promise<User> {
    const user = await this.userRepository.findById(identityId);
    if (!user) throw new UserNotFoundError();
    return user;
  }
}
