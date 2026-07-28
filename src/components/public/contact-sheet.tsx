"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { Mail, X } from "lucide-react"

import { InstagramIcon } from "@/components/shared/instagram-icon"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { useAttributedWhatsapp } from "@/hooks/use-attributed-whatsapp"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

// Mesmo padrão do MobileFiltersSheet/MobileNav: portal pro body evita que
// um backdrop-filter de algum ancestral vire containing block do `fixed`.
export function ContactSheet({
  trigger,
}: {
  trigger: (props: { onClick: () => void }) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { phone, realtorName } = useAttributedWhatsapp()

  useEffect(() => {
    setMounted(true)
  }, [])

  const whatsappHref = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        realtorName
          ? `Olá ${realtorName}! Vim pelo site da Bebiano Imóveis e gostaria de mais informações.`
          : "Olá! Vim pelo site da Bebiano Imóveis e gostaria de mais informações."
      )}`
    : null

  const options = [
    whatsappHref
      ? {
          href: whatsappHref,
          label: "WhatsApp",
          description: realtorName ? `Falar com ${realtorName}` : "Falar com um corretor",
          icon: WhatsAppIcon,
          external: true,
        }
      : null,
    {
      href: `mailto:${siteConfig.email}`,
      label: "E-mail",
      description: siteConfig.email,
      icon: Mail,
      external: false,
    },
    {
      href: siteConfig.instagram,
      label: "Instagram",
      description: "@bebianoimoveis",
      icon: InstagramIcon,
      external: true,
    },
  ].filter((option) => option !== null)

  return (
    <>
      {trigger({ onClick: () => setOpen(true) })}

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[100] flex flex-col bg-black/50 md:hidden"
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 32, stiffness: 320 }}
                    className="mt-auto rounded-t-2xl bg-background p-5 pb-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-heading text-lg font-semibold">Fale com a gente</p>
                      <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setOpen(false)}
                        className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                      >
                        <X className="size-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {options.map((option) => (
                        <a
                          key={option.label}
                          href={option.href}
                          target={option.external ? "_blank" : undefined}
                          rel={option.external ? "noopener noreferrer" : undefined}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-xl border border-border/60 p-3.5 transition-colors hover:border-primary hover:bg-secondary/50"
                        >
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                            )}
                          >
                            <option.icon className="size-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-medium">{option.label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  )
}
