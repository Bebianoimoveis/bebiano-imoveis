import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"

import { InstagramIcon } from "@/components/shared/instagram-icon"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { siteConfig } from "@/config/site"

const SOCIAL_LINK_CLASS =
  "flex size-12 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground"

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
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-medium">Contato</p>
          <div className="flex items-center gap-3">
            {siteConfig.whatsapp ? (
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar no WhatsApp"
                className={SOCIAL_LINK_CLASS}
              >
                <WhatsAppIcon className="size-5" />
              </a>
            ) : null}
            <a
              href={`mailto:${siteConfig.email}`}
              aria-label="Enviar e-mail"
              className={SOCIAL_LINK_CLASS}
            >
              <Mail className="size-5" />
            </a>
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Bebiano Imóveis"
              className={SOCIAL_LINK_CLASS}
            >
              <InstagramIcon className="size-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          © {year} {siteConfig.name}. Todos os direitos reservados.
        </p>
        <a
          href="https://g2genesys.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          Desenvolvido por G2 Genesys
        </a>
      </div>
    </footer>
  )
}
