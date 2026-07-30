import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

export function LeadAvatar({ name, size = "default" }: { name: string; size?: "sm" | "default" }) {
  return (
    <Avatar size={size}>
      <AvatarFallback className="bg-primary/15 text-primary">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
