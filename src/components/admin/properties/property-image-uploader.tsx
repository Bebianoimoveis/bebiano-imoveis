"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlus, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createPropertyImageUploadSignature } from "@/modules/upload/actions"
import { uploadPropertyImage } from "@/modules/upload/client"
import {
  addPropertyImages,
  removePropertyImage,
  setCoverImage,
} from "@/modules/property/actions"

type PropertyImage = {
  id: string
  url: string
  isCover: boolean
}

export function PropertyImageUploader({
  propertyId,
  images,
}: {
  propertyId: string
  images: PropertyImage[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    setIsUploading(true)
    try {
      const signature = await createPropertyImageUploadSignature()
      const files = Array.from(fileList)

      const uploaded = await Promise.all(
        files.map((file) => uploadPropertyImage(file, signature))
      )

      await addPropertyImages(propertyId, uploaded)
      toast.success(
        uploaded.length > 1
          ? `${uploaded.length} imagens adicionadas.`
          : "Imagem adicionada."
      )
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar imagens."
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleRemove(imageId: string) {
    startTransition(async () => {
      try {
        await removePropertyImage(imageId)
        toast.success("Imagem removida.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao remover.")
      }
    })
  }

  function handleSetCover(imageId: string) {
    startTransition(async () => {
      try {
        await setCoverImage(propertyId, imageId)
        toast.success("Imagem principal definida.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao definir capa.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border/60 bg-muted"
          >
            <Image
              src={image.url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {image.isCover ? (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Capa
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-linear-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {!image.isCover ? (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-7"
                  disabled={isPending}
                  onClick={() => handleSetCover(image.id)}
                >
                  <Star className="size-3.5" />
                </Button>
              ) : null}
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="size-7"
                disabled={isPending}
                onClick={() => handleRemove(image.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <label className="flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <ImagePlus className="size-6" />
          {isUploading ? "Enviando..." : "Adicionar fotos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={isUploading}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>
    </div>
  )
}
