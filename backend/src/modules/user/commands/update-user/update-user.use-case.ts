import type { User } from '../../domain/user.entity'
import {
    EmailAlreadyTakenError,
    PseudoAlreadyTakenError,
    UserNotFoundError,
} from '../../domain/user.errors'
import type { UserRepositoryPort } from '../../database/user.repository.port'
import type { IdentityProvider } from '../../../auth/identity-provider.port'
import type { UpdateUserRequest } from './update-user.request.dto'

export class UpdateUserUseCase {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly identityProvider: IdentityProvider,
    ) {}

    async execute(userId: string, input: UpdateUserRequest): Promise<User> {
        const currentUser = await this.userRepository.findById(userId)

        if (!currentUser) {
            throw new UserNotFoundError()
        }

        if (input.pseudo !== currentUser.pseudo) {
            const existingUser = await this.userRepository.findByPseudo(
                input.pseudo,
            )

            if (existingUser && existingUser.id !== userId) {
                throw new PseudoAlreadyTakenError()
            }
        }

        const emailChanged =
            input.email.toLowerCase() !== currentUser.email.toLowerCase()

        if (emailChanged) {
            await this.ensureEmailIsAvailable(userId, input.email)
            await this.identityProvider.updateEmail(userId, input.email)
        }

        try {
            return await this.userRepository.updateProfile(userId, input)
        } catch (error) {
            // Rainbow et la base locale doivent rester synchronisés.
            if (emailChanged) {
                await this.identityProvider
                    .updateEmail(userId, currentUser.email)
                    .catch(() => {
                        // On remonte l'erreur d'origine, pas celle du rollback.
                    })
            }
            throw error
        }
    }

    private async ensureEmailIsAvailable(
        userId: string,
        email: string,
    ): Promise<void> {
        const localUser = await this.userRepository.findByEmail(email)

        if (localUser && localUser.id !== userId) {
            throw new EmailAlreadyTakenError()
        }

        const isAvailable = await this.identityProvider.isEmailAvailable(email)

        if (!isAvailable) {
            throw new EmailAlreadyTakenError()
        }
    }
}