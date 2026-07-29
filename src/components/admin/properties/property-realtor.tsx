import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

export function PropertyRealtor({
  realtor,
}: {
  realtor: { photoUrl: string | null; creci: string | null; user: { name: string } } | null
}) {
  if (!realtor) {
    return <span className="text-sm text-muted-foreground">Não atribuído</span>
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        {realtor.photoUrl ? <AvatarImage src={realtor.photoUrl} alt={realtor.user.name} /> : null}
        <AvatarFallback className="bg-primary/15 text-primary">
          {initials(realtor.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{realtor.user.name}</p>
        {realtor.creci ? (
          <p className="truncate text-xs text-muted-foreground">CRECI {realtor.creci}</p>
        ) : null}
      </div>
    </div>
  )
}
