import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Users2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createCommunitySchema,
  useCreateCommunity,
  type CreateCommunityForm,
} from '../api/create-community'

type CommunityCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyForm: CreateCommunityForm = {
  name: '',
  description: '',
  subGroups: [{ name: '', theme: '' }],
}

export function CommunityCreateDialog({
  open,
  onOpenChange,
}: CommunityCreateDialogProps) {
  const form = useForm<CreateCommunityForm>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: emptyForm,
  })

  const { fields, append, remove } = useFieldArray({
    name: 'subGroups',
    control: form.control,
  })

  const createCommunity = useCreateCommunity({
    onSuccess: (community) => {
      toast.success(`La communauté « ${community.name} » a été créée`)
      form.reset(emptyForm)
      onOpenChange(false)
    },
  })

  const onSubmit = (values: CreateCommunityForm) => {
    createCommunity.mutate(values)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset(emptyForm)
        onOpenChange(state)
      }}
    >
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <Users2 /> Créer une communauté
          </DialogTitle>
          <DialogDescription>
            Rassemblez des gens autour d'un sujet. Chaque sous-groupe crée une
            bulle d'échange.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='community-create-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='ex : Passionnés de photographie'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className='resize-none'
                      placeholder='Décrivez le sujet de votre communauté'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='space-y-3'>
              <FormLabel>Sous-groupes</FormLabel>
              {fields.map((arrayField, index) => (
                <div
                  key={arrayField.id}
                  className='flex items-start gap-2 rounded-md border p-3'
                >
                  <div className='grid flex-1 gap-2 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`subGroups.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder='Nom du sous-groupe'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`subGroups.${index}.theme`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder='Thème' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => append({ name: '', theme: '' })}
              >
                <Plus /> Ajouter un sous-groupe
              </Button>
            </div>
          </form>
        </Form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Annuler</Button>
          </DialogClose>
          <Button
            type='submit'
            form='community-create-form'
            disabled={createCommunity.isPending}
          >
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
