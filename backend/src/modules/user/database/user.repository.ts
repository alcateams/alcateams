import { Prisma } from '../../../generated/prisma/client'
import { database } from '../../../lib/database'
import type { User } from '../domain/user.entity'
import {
  EmailAlreadyTakenError,
  PseudoAlreadyTakenError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../domain/user.errors'
import { toEntity, toPersistence } from './user.mapper'
import type {
  UpdateProfileData,
  UserRepositoryPort,
} from './user.repository.port'

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002'
const RECORD_NOT_FOUND = 'P2025'

export class UserRepository implements UserRepositoryPort {
  async saveUser(user: User): Promise<User> {
    try {
      const record = await database.user.create({
        data: toPersistence(user),
      })

      return toEntity(record)
    } catch (error) {
      throw this.translatePersistenceError(error)
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await database.user.findUnique({
      where: { email },
    })

    return record ? toEntity(record) : null
  }

  async findByPseudo(pseudo: string): Promise<User | null> {
    const record = await database.user.findUnique({
      where: { pseudo },
    })

    return record ? toEntity(record) : null
  }

  async findById(id: string): Promise<User | null> {
    const record = await database.user.findUnique({
      where: { id },
    })

    return record ? toEntity(record) : null
  }

  async updateProfile(
      userId: string,
      data: UpdateProfileData,
  ): Promise<User> {
    try {
      const record = await database.user.update({
        where: { id: userId },
        data: {
          pseudo: data.pseudo,
          email: data.email,
          bio: data.bio,
          urls: data.urls,
        },
      })

      return toEntity(record)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
          const target = error.meta?.target
          const fields = Array.isArray(target) ? target : [target]

          if (fields.includes('pseudo')) {
            throw new PseudoAlreadyTakenError()
          }

          if (fields.includes('email')) {
            throw new EmailAlreadyTakenError()
          }
        }

        if (error.code === RECORD_NOT_FOUND) {
          throw new UserNotFoundError()
        }
      }

      throw error
    }
  }

  private translatePersistenceError(error: unknown): unknown {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      const target = error.meta?.target
      const fields = Array.isArray(target) ? target : [target]

      if (fields.includes('pseudo')) {
        return new PseudoAlreadyTakenError()
      }

      if (fields.includes('email')) {
        return new UserAlreadyExistsError()
      }
    }

    return error
  }
}