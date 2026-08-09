import Image from "next/image"

// Imagem em modo paisagem (fornecida pela cliente) — a anterior era
// vertical (foto de celular) e cortava boa parte do enquadramento numa
// tela larga de desktop via object-cover.
const HERO_POSTER = "/images/hero-bg.png"
const HERO_ALT = "Bebiano Imóveis"

// Grade cinematográfica reduzida a 3 filtros (era contrast+saturate+
// brightness+sepia+grayscale) — sepia/grayscale eram os ajustes mais
// sutis do grupo e cada filter CSS a mais nessa imagem em tela cheia,
// animada pelo Parallax, é mais uma camada recompositada a cada frame
// de scroll. object-position central: a imagem paisagem já cobre bem o
// quadro sem precisar compensar recorte.
const MEDIA_FILTER = "object-cover object-center contrast-[1.1] saturate-[0.75] brightness-[0.9]"

export function HeroBackground({ posterUrl }: { posterUrl?: string | null }) {
  return (
    <div className="relative size-full">
      <Image
        src={posterUrl || HERO_POSTER}
        alt={HERO_ALT}
        fill
        priority
        sizes="100vw"
        className={MEDIA_FILTER}
      />
    </div>
  )
}
