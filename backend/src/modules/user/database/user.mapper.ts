import type { User as PrismaUser } from "../../../generated/prisma/client";
import { User } from "../domain/user.entity";
import type { UserProps } from "../domain/user.types";

export function toEntity(record: PrismaUser): User {
  return new User({
    id: record.id,
    email: record.email,
    pseudo: record.pseudo,
    bio: record.bio,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPersistence(user: User): UserProps {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
