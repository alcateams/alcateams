import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Community } from '@/types/api'
import { api } from '@/lib/api-client'
import { myCommunitiesQueryKey } from './get-my-communities'

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères'),
  description: z
    .string()
    .min(1, 'Veuillez saisir une description')
    .max(500, 'La description ne peut pas dépasser 500 caractères'),
  themes: z
    .array(
      z.object({
        name: z
          .string()
          .min(2, 'Le thème doit faire au moins 2 caractères')
          .max(50, 'Le thème ne peut pas dépasser 50 caractères'),
      })
    )
    .min(1, 'Au moins un thème est requis'),
})

export type CreateCommunityForm = z.infer<typeof createCommunitySchema>

type CreateCommunityPayload = {
  name: string
  description: string
  themes: string[]
}

const createCommunity = (
  payload: CreateCommunityPayload
): Promise<Community> => {
  return api.post('/api/communities', payload)
}

type UseCreateCommunityOptions = {
  onSuccess?: (data: Community) => void
}

export const useCreateCommunity = ({
  onSuccess,
}: UseCreateCommunityOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, description, themes }: CreateCommunityForm) =>
      createCommunity({
        name,
        description,
        themes: themes.map((theme) => theme.name),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: myCommunitiesQueryKey })
      onSuccess?.(data)
    },
  })
}
