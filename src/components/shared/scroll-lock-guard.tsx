"use client"

import { useEffect } from "react"

// Select/Dropdown/Popover/Dialog do Radix travam o scroll do body ao abrir
// injetando uma tag <style> com `body[data-scroll-locked]{overflow:hidden
// !important}`. Isso esconde a barra de rolagem nativa e causa um salto
// horizontal de layout ao abrir/fechar qualquer um desses componentes.
//
// Uma regra normal no globals.css (mesmo com !important) depende da ordem
// de inserção das folhas de estilo e pode perder em alguns navegadores.
// `!important` em estilo inline sempre vence sobre `!important` de
// stylesheet, então forçamos isso via JS uma única vez — solução robusta
// e independente de navegador/ordem de carregamento.
export function ScrollLockGuard() {
  useEffect(() => {
    document.documentElement.style.setProperty("overflow", "visible", "important")
    document.body.style.setProperty("overflow", "visible", "important")
  }, [])

  return null
}
