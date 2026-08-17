"use client"

import { useEffect, useRef, useState } from "react"
import { ZoomIn } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Tamanho do círculo de recorte na tela (px) e da imagem final exportada
// (px, quadrada — o círculo é só a máscara visual, igual todo lugar que
// já exibe a foto do corretor dentro de um container redondo).
const FRAME_SIZE = 280
const OUTPUT_SIZE = 480
const MIN_ZOOM = 1
const MAX_ZOOM = 3

type ImageSource = { kind: "file"; file: File } | { kind: "url"; url: string }

export function PhotoCropDialog({
  source,
  onCancel,
  onConfirm,
}: {
  source: ImageSource | null
  onCancel: () => void
  onConfirm: (file: File) => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)

  const objectUrl = useRef<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!source) {
      setImageUrl(null)
      return
    }
    if (source.kind === "url") {
      setImageUrl(source.url)
      return
    }
    const url = URL.createObjectURL(source.file)
    objectUrl.current = url
    setImageUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      objectUrl.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  useEffect(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [imageUrl])

  const baseScale =
    naturalSize.width > 0
      ? Math.max(FRAME_SIZE / naturalSize.width, FRAME_SIZE / naturalSize.height)
      : 0
  const effectiveScale = baseScale * zoom
  const renderedWidth = naturalSize.width * effectiveScale
  const renderedHeight = naturalSize.height * effectiveScale
  const maxOffsetX = Math.max(0, (renderedWidth - FRAME_SIZE) / 2)
  const maxOffsetY = Math.max(0, (renderedHeight - FRAME_SIZE) / 2)

  function clampOffset(x: number, y: number, maxX = maxOffsetX, maxY = maxOffsetY) {
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragState.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const next = clampOffset(
      drag.originX + (e.clientX - drag.startX),
      drag.originY + (e.clientY - drag.startY)
    )
    setOffset(next)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragState.current?.pointerId === e.pointerId) dragState.current = null
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev - e.deltaY * 0.001)))
  }

  function handleZoomChange(next: number) {
    setZoom(next)
    setOffset((prev) => clampOffset(prev.x, prev.y))
  }

  function handleConfirm() {
    const img = imgRef.current
    if (!img || naturalSize.width === 0) return

    const srcSize = FRAME_SIZE / effectiveScale
    const srcX = naturalSize.width / 2 - srcSize / 2 - offset.x / effectiveScale
    const srcY = naturalSize.height / 2 - srcSize / 2 - offset.y / effectiveScale

    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    try {
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          onConfirm(new File([blob], "foto-perfil.jpg", { type: "image/jpeg" }))
        },
        "image/jpeg",
        0.92
      )
    } catch {
      // Canvas "tainted" por CORS — só deve acontecer recortando uma URL
      // externa sem cabeçalho de CORS liberado (não é o caso do Cloudinary
      // em uso normal, mas evita travar a tela silenciosamente se acontecer).
      toast.error("Não foi possível processar essa imagem. Tente selecionar o arquivo de novo.")
    }
  }

  return (
    <Dialog open={!!source} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-fit">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative touch-none overflow-hidden rounded-full bg-secondary select-none"
            style={{ width: FRAME_SIZE, height: FRAME_SIZE, cursor: "grab" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- precisa de <img> cru pro canvas.drawImage ler pixels; next/image não expõe o elemento real.
              <img
                ref={imgRef}
                src={imageUrl}
                alt=""
                crossOrigin="anonymous"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget
                  setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight })
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: renderedWidth || undefined,
                  height: renderedHeight || undefined,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  maxWidth: "none",
                }}
              />
            ) : null}
          </div>

          <div className="flex w-full max-w-56 items-center gap-2.5">
            <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Arraste a foto pra reposicionar e use o zoom pra ajustar — igual no WhatsApp.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
