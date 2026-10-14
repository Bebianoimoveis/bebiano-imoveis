// No celular, grades de cards viram uma fileira que desliza pro lado (com
// o próximo card aparecendo pela metade, indicando que dá pra arrastar) —
// a página Sobre ficava muito comprida com todos os cards empilhados. A
// partir de `sm` volta a ser grade normal; quem usa adiciona as colunas
// (ex: "sm:grid-cols-2 lg:grid-cols-4").
export const MOBILE_CAROUSEL =
  "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0"

export const MOBILE_CAROUSEL_ITEM = "w-[82%] shrink-0 snap-center sm:w-auto"
