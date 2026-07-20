import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"

import { InstagramIcon } from "@/components/shared/instagram-icon"
import { siteConfig } from "@/config/site"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-2">
          <Image
            src="/images/logo.png"
            alt={siteConfig.name}
            width={97}
            height={80}
            className="h-16 w-auto"
          />
          <p className="text-sm text-muted-foreground">
            {siteConfig.city} - {siteConfig.state}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Navegação</p>
          <div className="flex flex-col gap-1 text-muted-foreground">
            <Link href="/imoveis" className="hover:text-foreground">
              Todos os imóveis
            </Link>
            <Link href="/comprar" className="hover:text-foreground">
              Comprar
            </Link>
            <Link href="/alugar" className="hover:text-foreground">
              Alugar
            </Link>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Contato</p>
          <div className="flex flex-col gap-1 text-muted-foreground">
            {siteConfig.whatsapp ? <p>WhatsApp: {siteConfig.whatsapp}</p> : null}
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              {siteConfig.email}
            </a>
          </div>
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da Bebiano Imóveis"
            className="mt-1 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <InstagramIcon className="size-4" />
            @bebianoimoveis
          </a>
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
        © {year} {siteConfig.name}. Todos os direitos reservados.
      </div>
    </footer>
  )
}
