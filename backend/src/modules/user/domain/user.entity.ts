import type { CreateUserProps, UserProps } from "./user.types";

export class User {
  constructor(private readonly props: UserProps) {}

  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User({
      id: props.id,
      email: props.email,
      pseudo: props.pseudo,
      bio: null,
      urls: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get pseudo(): string {
    return this.props.pseudo;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get urls(): string[] {
    return this.props.urls;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): UserProps {
    return this.props;
  }
}
