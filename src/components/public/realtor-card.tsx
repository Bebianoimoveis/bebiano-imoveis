import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"

type RealtorCardData = {
  slug: string
  photoUrl: string | null
  photoPositionY: number | null
  creci: string | null
  user: { name: string }
}

// Card de corretor (foto, nome, CRECI) que leva ao perfil — usado na seção
// "Nossa equipe" (home/Sobre) e na página /corretores com a equipe inteira.
export function RealtorCard({ realtor }: { realtor: RealtorCardData }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 hover:ring-gold/30">
      <Link
        href={`/corretores/${realtor.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`Ver perfil de ${realtor.user.name}`}
      />
      <div className="relative aspect-square overflow-hidden bg-muted">
        {realtor.photoUrl ? (
          <Image
            src={realtor.photoUrl}
            alt={realtor.user.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            style={{ objectPosition: `center ${realtor.photoPositionY ?? 0}%` }}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <User className="size-10" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
      <div className="flex flex-col gap-0.5 p-4">
        <p className="text-[10px] font-medium tracking-widest text-gold-dark uppercase">Corretores</p>
        <p className="truncate font-medium transition-colors group-hover:text-gold-light">{realtor.user.name}</p>
        <p className={`text-xs text-muted-foreground ${realtor.creci ? "" : "invisible"}`}>
          CRECI {realtor.creci ?? "0"}
        </p>
      </div>
    </div>
  )
}
