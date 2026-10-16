// Páginas que abrem com um Hero de foto em tela cheia: nelas o header
// começa transparente por cima da foto (e fica sólido ao rolar) e o
// conteúdo não leva o respiro do tamanho do header no topo.
const HERO_PAGES = ["/", "/sobre"]

export function hasFullBleedHero(pathname: string) {
  return HERO_PAGES.includes(pathname)
}
