"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ImageOff, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateSettings } from "@/modules/settings/actions"
import { createSiteImageUploadSignature } from "@/modules/upload/actions"
import { uploadPropertyImage } from "@/modules/upload/client"
import { siteSettingsInputSchema, type SiteSettingsInput } from "@/modules/settings/schema"

export function SettingsForm({ defaultValues }: { defaultValues: SiteSettingsInput }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingField, setUploadingField] = useState<"heroImageUrl" | "aboutStoryImageUrl" | null>(null)

  const form = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsInputSchema),
    defaultValues,
  })

  async function handleImageChange(
    field: "heroImageUrl" | "aboutStoryImageUrl",
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingField(field)
    try {
      const signature = await createSiteImageUploadSignature()
      const uploaded = await uploadPropertyImage(file, signature)
      form.setValue(field, uploaded.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar imagem.")
    } finally {
      setUploadingField(null)
      e.target.value = ""
    }
  }

  async function onSubmit(values: SiteSettingsInput) {
    setIsSubmitting(true)
    try {
      await updateSettings(values)
      toast.success("Configurações salvas.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail de contato</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aboutText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto institucional (Quem somos)</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário de funcionamento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Seg a Sex, 9h às 18h" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-xl border border-border/60 p-4">
          <div>
            <p className="text-sm font-medium">Imagens do site</p>
            <p className="text-xs text-muted-foreground">
              Usadas no Hero (home e Sobre Nós) e na seção "Nossa História". Não inclui fotos de
              corretor, que ficam em Corretores.
            </p>
          </div>

          <FormField
            control={form.control}
            name="heroImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagem de fundo do Hero</FormLabel>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                    {field.value ? (
                      <Image src={field.value} alt="Imagem do Hero" fill className="object-cover" sizes="112px" />
                    ) : (
                      <ImageOff className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageChange("heroImageUrl", e)}
                        disabled={uploadingField === "heroImageUrl"}
                      />
                    </FormControl>
                    {uploadingField === "heroImageUrl" ? (
                      <p className="text-xs text-muted-foreground">Enviando...</p>
                    ) : field.value ? (
                      <button
                        type="button"
                        onClick={() => form.setValue("heroImageUrl", "")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" /> Remover (volta pra imagem padrão)
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma — usando a imagem padrão.</p>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aboutStoryImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagem da seção "Nossa História"</FormLabel>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                    {field.value ? (
                      <Image src={field.value} alt="Imagem da Nossa História" fill className="object-cover" sizes="112px" />
                    ) : (
                      <ImageOff className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageChange("aboutStoryImageUrl", e)}
                        disabled={uploadingField === "aboutStoryImageUrl"}
                      />
                    </FormControl>
                    {uploadingField === "aboutStoryImageUrl" ? (
                      <p className="text-xs text-muted-foreground">Enviando...</p>
                    ) : field.value ? (
                      <button
                        type="button"
                        onClick={() => form.setValue("aboutStoryImageUrl", "")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" /> Remover (volta pro corretor/imagem padrão)
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma — usando a foto de um corretor cadastrado, ou a imagem padrão.
                      </p>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rentalEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 rounded-xl border border-border/60 p-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-border"
                />
              </FormControl>
              <div>
                <FormLabel className="font-normal">Atender locação (Alugar)</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Desligado: o site só mostra Venda (nenhum "Alugar" na navegação/busca). Ligue quando a
                  imobiliária passar a atender locação.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram (URL)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook (URL)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>
    </Form>
  )
}
