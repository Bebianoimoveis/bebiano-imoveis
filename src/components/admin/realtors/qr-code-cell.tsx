"use client"

import { Download, ZoomIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CopyLinkButton } from "@/components/admin/realtors/copy-link-button"

export function QrCodeCell({
  name,
  link,
  qrCode,
}: {
  name: string
  link: string
  qrCode: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative flex size-14 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-white transition-shadow hover:shadow-md hover:ring-2 hover:ring-primary/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI gerada no servidor, não faz sentido passar pelo otimizador de imagens */}
          <img src={qrCode} alt={`QR Code do link de ${name}`} className="size-full" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
            <ZoomIn className="size-4 text-white" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR Code de {name}</DialogTitle>
          <DialogDescription>
            Aponte a câmera para o código ou baixe a imagem para usar em materiais impressos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI gerada no servidor, não faz sentido passar pelo otimizador de imagens */}
          <img src={qrCode} alt={`QR Code do link de ${name}`} className="size-64" />
        </div>
        <code className="block truncate rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          {link}
        </code>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <a href={qrCode} download={`qrcode-${name.toLowerCase().replace(/\s+/g, "-")}.png`}>
              <Download className="size-4" />
              Baixar QR Code
            </a>
          </Button>
          <CopyLinkButton link={link} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
