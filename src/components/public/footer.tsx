import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"

import { InstagramIcon } from "@/components/shared/instagram-icon"
import { FooterWhatsappLink } from "@/components/public/footer-whatsapp-link"
import { getPublicSiteAddress } from "@/modules/settings/actions"
import { siteConfig } from "@/config/site"

const SOCIAL_LINK_CLASS =
  "flex size-12 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground"

export async function Footer({ rentalEnabled = false }: { rentalEnabled?: boolean }) {
  const year = new Date().getFullYear()
  const address = await getPublicSiteAddress()

  return (
    <footer className="border-t border-border/60 bg-secondary/30 pb-16 md:pb-0">
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
            {rentalEnabled ? (
              <Link href="/alugar" className="hover:text-foreground">
                Alugar
              </Link>
            ) : null}
            <Link href="/anunciar" className="hover:text-foreground">
              Anunciar meu imóvel
            </Link>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-medium">Contato</p>
          <div className="flex items-center gap-3">
            <FooterWhatsappLink className={SOCIAL_LINK_CLASS} />
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
          {address ? <p className="text-muted-foreground">{address}</p> : null}
        </div>
      </div>

      {address ? (
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="overflow-hidden rounded-2xl ring-1 ring-border/60">
            <iframe
              title="Localização da Bebiano Imóveis"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="h-56 w-full grayscale-[35%] sm:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-1 border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
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
