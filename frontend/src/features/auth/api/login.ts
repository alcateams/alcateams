import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { type AuthResponse } from '@/types/api'
import { api } from '@/lib/api-client'

export const loginInputSchema = z.object({
  email: z
    .string()
    .min(1, 'Veuillez saisir votre email')
    .email('Email invalide'),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe'),
})

export type LoginInput = z.infer<typeof loginInputSchema>

const loginWithEmailAndPassword = (
  credentials: LoginInput
): Promise<AuthResponse> => {
  return api.post('/api/users/login', credentials)
}

type UseLoginOptions = {
  onSuccess?: (data: AuthResponse) => void
}

export const useLogin = ({ onSuccess }: UseLoginOptions = {}) => {
  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess,
  })
}
