"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import {
  Building2,
  ChevronRight,
  Heart,
  Home,
  KeyRound,
  Lock,
  Mail,
  Search,
  User,
  X,
} from "lucide-react"

import { ContactSheet } from "@/components/public/contact-sheet"
import { InstagramIcon } from "@/components/shared/instagram-icon"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { useAttributedWhatsapp } from "@/hooks/use-attributed-whatsapp"
import { countPublicProperties } from "@/modules/property/actions"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/imoveis", label: "Todos os imóveis", icon: Search },
  { href: "/comprar", label: "Comprar", icon: Building2 },
  { href: "/alugar", label: "Alugar", icon: KeyRound },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
]

const CONTACT_ITEMS = [
  { href: siteConfig.instagram, label: "Instagram", icon: InstagramIcon, external: true },
  { href: `mailto:${siteConfig.email}`, label: "E-mail", icon: Mail, external: false },
]

// Mesma "assinatura de movimento" usada no Hero — cascata de entrada em
// vez de tudo aparecendo de uma vez.
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// Drawer lateral (não mais tela cheia) — portal pro body pelo mesmo
// motivo de sempre: um backdrop-filter em algum ancestral vira containing
// block de elementos `fixed`, quebrando o `inset-0`.
export function MobileNav({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const hasFetchedCount = useRef(false)
  const pathname = usePathname()
  const { phone, realtorName } = useAttributedWhatsapp()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Busca a contagem só na primeira vez que o menu abre, não a cada
  // abertura — o número não muda a ponto de justificar refazer a busca.
  useEffect(() => {
    if (!open || hasFetchedCount.current) return
    hasFetchedCount.current = true
    countPublicProperties()
      .then(setCount)
      .catch(() => {})
  }, [open])

  if (!mounted) return null

  const whatsappHref = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        realtorName
          ? `Olá ${realtorName}! Vim pelo site da Bebiano Imóveis e gostaria de mais informações.`
          : "Olá! Vim pelo site da Bebiano Imóveis e gostaria de mais informações."
      )}`
    : null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex justify-end bg-black/45 backdrop-blur-[16px] md:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full w-[86%] max-w-[400px] flex-col overflow-y-auto rounded-l-3xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="flex flex-1 flex-col"
            >
              {/* Cabeçalho */}
              <motion.div variants={item} className="flex items-start justify-between px-6 pt-6">
                <div>
                  <Image
                    src="/images/logo.png"
                    alt={siteConfig.name}
                    width={130}
                    height={108}
                    priority
                    className="h-12 w-auto"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Encontre o imóvel ideal.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar menu"
                  onClick={onClose}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-foreground transition-colors hover:bg-secondary"
                >
                  <X className="size-4.5" />
                </button>
              </motion.div>

              {/* Resumo de credibilidade */}
              <motion.div
                variants={item}
                className="mx-6 mt-5 flex w-fit items-center gap-2 rounded-full bg-secondary/60 px-4 py-2.5 text-sm text-foreground/80"
              >
                <Building2 className="size-4 text-primary" />
                {count === null
                  ? "Carregando imóveis…"
                  : `${count} ${count === 1 ? "imóvel disponível" : "imóveis disponíveis"}`}
              </motion.div>

              {/* Card principal — abre o menu de canais de contato */}
              <motion.div variants={item} className="mt-5 px-6">
                <ContactSheet
                  trigger={({ onClick }) => (
                    <motion.button
                      type="button"
                      onClick={onClick}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-gold">
                        <User className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">Fale com um corretor</span>
                        <span className="block text-sm text-muted-foreground">
                          Atendimento personalizado
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-muted-foreground" />
                    </motion.button>
                  )}
                />
              </motion.div>

              {/* Navegação */}
              <motion.div variants={item} className="mt-6 px-6">
                <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
                  Navegação
                </p>
                <div className="space-y-1">
                  {NAV_ITEMS.map((navItem) => {
                    const isActive = pathname === navItem.href
                    const Icon = navItem.icon
                    return (
                      <motion.div key={navItem.href} whileTap={{ scale: 0.98 }}>
                        <Link
                          href={navItem.href}
                          onClick={onClose}
                          className={cn(
                            "relative flex items-center gap-3 rounded-2xl py-3.5 pr-3 pl-4 transition-colors",
                            isActive ? "bg-primary/5" : "hover:bg-secondary/50"
                          )}
                        >
                          {isActive ? (
                            <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
                          ) : null}
                          <Icon
                            className={cn(
                              "size-[18px]",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "flex-1 text-[15px]",
                              isActive ? "font-medium text-primary" : "text-foreground"
                            )}
                          >
                            {navItem.label}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground/60" />
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Contato (canais externos) */}
              <motion.div variants={item} className="mt-6 px-6">
                <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
                  Contato
                </p>
                <div className="space-y-1">
                  {CONTACT_ITEMS.map((contactItem) => {
                    const Icon = contactItem.icon
                    return (
                      <motion.div key={contactItem.label} whileTap={{ scale: 0.98 }}>
                        <a
                          href={contactItem.href}
                          target={contactItem.external ? "_blank" : undefined}
                          rel={contactItem.external ? "noopener noreferrer" : undefined}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-2xl py-3.5 pr-3 pl-4 text-foreground transition-colors hover:bg-secondary/50"
                        >
                          <Icon className="size-[18px] text-muted-foreground" />
                          <span className="flex-1 text-[15px]">{contactItem.label}</span>
                          <ChevronRight className="size-4 text-muted-foreground/60" />
                        </a>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* CTA de WhatsApp — atalho direto, separado do card de cima */}
              <motion.div variants={item} className="mt-6 px-6">
                {whatsappHref ? (
                  <motion.a
                    whileTap={{ scale: 0.97 }}
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="flex items-center gap-4 rounded-3xl bg-primary p-4 text-primary-foreground shadow-lg"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <WhatsAppIcon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">Falar no WhatsApp</span>
                      <span className="block text-sm text-primary-foreground/80">
                        Atendimento rápido
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-primary-foreground/70" />
                  </motion.a>
                ) : null}
              </motion.div>

              {/* Rodapé */}
              <motion.div
                variants={item}
                className="mt-auto flex flex-col items-center gap-1 px-6 py-6 text-center"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-3.5" />
                  {siteConfig.url.replace(/^https?:\/\//, "")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {siteConfig.name} · {new Date().getFullYear()}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
