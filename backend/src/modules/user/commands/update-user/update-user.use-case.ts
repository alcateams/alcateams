import type { User } from "../../domain/user.entity";
import {
  EmailAlreadyTakenError,
  PseudoAlreadyTakenError,
  UserNotFoundError,
} from "../../domain/user.errors";
import type { UserRepositoryPort } from "../../database/user.repository.port";
import type { AccountChanges, IdentityProvider } from "../../../auth/identity-provider.port";
import type { UpdateUserRequest } from "./update-user.request.dto";

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(userId: string, input: UpdateUserRequest): Promise<User> {
    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) {
      throw new UserNotFoundError();
    }

    const pseudoChanged = input.pseudo !== currentUser.pseudo;
    const emailChanged = input.email !== currentUser.email.toLowerCase();

    if (pseudoChanged) {
      const existingUser = await this.userRepository.findByPseudo(input.pseudo);
      if (existingUser && existingUser.id !== userId) {
        throw new PseudoAlreadyTakenError();
      }
    }

    if (emailChanged) {
      await this.ensureEmailIsAvailable(userId, input.email);
    }

    // The identity provider is updated first so a rejected change never reaches our database.
    const accountChanges: AccountChanges = {
      ...(emailChanged && { email: input.email }),
      ...(pseudoChanged && { pseudo: input.pseudo }),
    };
    const hasAccountChanges = emailChanged || pseudoChanged;

    if (hasAccountChanges) {
      await this.identityProvider.updateAccount(userId, accountChanges);
    }

    try {
      return await this.userRepository.updateProfile(userId, input);
    } catch (error) {
      // The identity provider and the local database must stay in sync.
      if (hasAccountChanges) {
        await this.rollbackAccount(userId, currentUser, accountChanges);
      }
      throw error;
    }
  }

  private async rollbackAccount(
    userId: string,
    previous: User,
    applied: AccountChanges,
  ): Promise<void> {
    try {
      await this.identityProvider.updateAccount(userId, {
        ...(applied.email !== undefined && { email: previous.email }),
        ...(applied.pseudo !== undefined && { pseudo: previous.pseudo }),
      });
    } catch (rollbackError) {
      // Surface the original error to the caller, but leave a trace of the desync.
      console.error("[update-profile] rollback de l'identité impossible :", userId, rollbackError);
    }
  }

  private async ensureEmailIsAvailable(userId: string, email: string): Promise<void> {
    const localUser = await this.userRepository.findByEmail(email);
    if (localUser && localUser.id !== userId) {
      throw new EmailAlreadyTakenError();
    }

    if (!(await this.identityProvider.isEmailAvailable(email))) {
      throw new EmailAlreadyTakenError();
    }
  }
}
