import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import { api } from '@/lib/api-client'
import { type AuthResponse } from '@/types/api'

export const registerInputSchema = z
  .object({
    email: z.string().min(1, 'Veuillez saisir votre email').email('Email invalide'),
    pseudo: z
      .string()
      .min(2, 'Le pseudo doit faire au moins 2 caractères')
      .max(30, 'Le pseudo ne peut pas dépasser 30 caractères'),
    password: z
      .string()
      .min(12, 'Le mot de passe doit faire au moins 12 caractères')
      .max(64, 'Le mot de passe ne peut pas dépasser 64 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
        'Le mot de passe doit contenir au moins 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial',
      ),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerInputSchema>

const registerWithEmailAndPassword = (
  account: Omit<RegisterInput, 'confirmPassword'>,
): Promise<AuthResponse> => {
  return api.post('/api/users/register', account)
}

type UseRegisterOptions = {
  onSuccess?: (data: AuthResponse) => void
}

export const useRegister = ({ onSuccess }: UseRegisterOptions = {}) => {
  return useMutation({
    mutationFn: ({ confirmPassword: _, ...accountToCreate }: RegisterInput) =>
      registerWithEmailAndPassword(accountToCreate),
    onSuccess,
  })
}
