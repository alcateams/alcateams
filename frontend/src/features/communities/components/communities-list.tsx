import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMyCommunities } from '../api/get-my-communities'

export function CommunitiesList() {
  const { data: communities, isLoading } = useMyCommunities()

  if (isLoading) {
    return <p className='text-muted-foreground'>Chargement des communautés…</p>
  }

  if (!communities || communities.length === 0) {
    return (
      <p className='text-muted-foreground'>
        Vous n'avez pas encore de communauté. Créez-en une pour commencer.
      </p>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {communities.map((community) => (
        <Card key={community.id}>
          <CardHeader>
            <CardTitle>{community.name}</CardTitle>
            <CardDescription>{community.description}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            {community.themes.map((theme) => (
              <Badge key={theme.id} variant='secondary'>
                {theme.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
