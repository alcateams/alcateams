import { useEffect } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useCurrentUser,
  useUpdateProfile,
} from '@/features/auth/api/current-user'

const MAX_URLS = 5

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const profileFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters.')
    .max(30, 'Username must not be longer than 30 characters.'),
  email: z.email('Please enter a valid email.'),
  bio: z
    .string()
    .max(160, 'Bio must not exceed 160 characters.')
    .optional()
    .or(z.literal('')),
  urls: z
    .array(
      z.object({
        value: z
          .string()
          .refine(
            (v) => v.trim() === '' || isHttpUrl(v.trim()),
            'Please enter a valid http(s) URL.'
          ),
      })
    )
    .max(MAX_URLS, `You can add up to ${MAX_URLS} URLs.`)
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: ProfileFormValues = {
  username: '',
  email: '',
  bio: '',
  urls: [],
}

function getErrorMessage(error: unknown): string {
  const serverMessage = (
    error as { response?: { data?: { error?: unknown } } } | null
  )?.response?.data?.error

  return typeof serverMessage === 'string'
    ? serverMessage
    : 'Unable to update your profile. Please try again.'
}

export function ProfileForm() {
  const { data: user, isLoading, isError } = useCurrentUser()
  const updateProfile = useUpdateProfile()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  useEffect(() => {
    if (!user) return

    form.reset({
      username: user.pseudo,
      email: user.email,
      bio: user.bio ?? '',
      urls: user.urls.map((value) => ({ value })),
    })
  }, [user, form])

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        pseudo: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        bio: data.bio?.trim() || null,
        urls: (data.urls ?? []).map((u) => u.value.trim()).filter(Boolean),
      })
    } catch {
      // The error is displayed in the form.
    }
  }

  if (isLoading) {
    return <p>Loading profile...</p>
  }

  if (isError || !user) {
    return <p role='alert'>Unable to load your profile. Please try again.</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='shadcn' {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' {...field} />
              </FormControl>
              <FormDescription>
                This is also the email you use to sign in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Tell us a little bit about yourself'
                  className='resize-none'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map((item, index) => (
            <FormField
              control={form.control}
              key={item.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>
                    URLs
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    Add links to your website, blog, or social media profiles.
                  </FormDescription>
                  <div className={cn('flex gap-2', index !== 0 && 'mt-1.5')}>
                    <FormControl>
                      <Input placeholder='https://example.com' {...field} />
                    </FormControl>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='mt-2'
            disabled={fields.length >= MAX_URLS}
            onClick={() => append({ value: '' })}
          >
            Add URL
          </Button>
        </div>

        {updateProfile.isError && (
          <p role='alert' className='text-sm text-destructive'>
            {getErrorMessage(updateProfile.error)}
          </p>
        )}

        {updateProfile.isSuccess && !form.formState.isDirty && (
          <p role='status' className='text-sm text-green-600'>
            Profile updated successfully.
          </p>
        )}

        <Button
          type='submit'
          disabled={updateProfile.isPending || !form.formState.isDirty}
        >
          {updateProfile.isPending ? 'Saving...' : 'Update profile'}
        </Button>
      </form>
    </Form>
  )
}
