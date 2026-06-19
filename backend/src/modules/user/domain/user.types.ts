export interface UserProps {
  id: string;
  email: string;
  pseudo: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  id: string;
  email: string;
  pseudo: string;
}
