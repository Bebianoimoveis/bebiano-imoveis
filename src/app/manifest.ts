import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

// Ícone de "adicionar à tela inicial" no Android/Chrome — o favicon
// (icon.png) tem fundo transparente, bom pra aba do navegador, mas ruim
// como ícone de app (Android preenche a transparência com branco). O
// apple-icon.png já tem fundo sólido na cor da marca, por isso é
// reaproveitado aqui também.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "Bebiano",
    description: "Imóveis à venda e para locação em Mogi das Cruzes e Alto Tietê.",
    start_url: "/",
    display: "standalone",
    background_color: "#180a0e",
    theme_color: "#180a0e",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
