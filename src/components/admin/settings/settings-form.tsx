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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { SettingsSection } from "@/components/admin/settings/settings-section"
import { AboutStatsFields } from "@/components/admin/settings/about-stats-fields"
import { AboutMissionValuesFields } from "@/components/admin/settings/about-mission-values-fields"
import { AboutFoundationsFields } from "@/components/admin/settings/about-foundations-fields"
import { AboutItemListFields } from "@/components/admin/settings/about-item-list-fields"
import { updateSettings } from "@/modules/settings/actions"
import { createSiteImageUploadSignature } from "@/modules/upload/actions"
import { uploadPropertyImage } from "@/modules/upload/client"
import { siteSettingsInputSchema, type SiteSettingsInput } from "@/modules/settings/schema"

export function SettingsForm({ defaultValues }: { defaultValues: SiteSettingsInput }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingField, setUploadingField] = useState<
    "heroImageUrl" | "aboutHeroImageUrl" | "aboutStoryImageUrl" | null
  >(null)

  const form = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsInputSchema),
    defaultValues,
  })

  async function handleImageChange(
    field: "heroImageUrl" | "aboutHeroImageUrl" | "aboutStoryImageUrl",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="sobre">Página Sobre Nós</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 pt-4">
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
                  Cada campo abaixo mostra exatamente em qual página e qual parte do site ela aparece. Não
                  inclui fotos de corretor, que ficam em Corretores.
                </p>
              </div>

              <FormField
                control={form.control}
                name="heroImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem de fundo do Hero — Página inicial</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Aparece só na página inicial, a foto grande atrás da barra de busca. Independente da
                      imagem da Sobre Nós logo abaixo — trocar uma não muda a outra. Formato paisagem
                      funciona melhor (mais larga que alta).
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                        {field.value ? (
                          <Image
                            src={field.value}
                            alt="Imagem do Hero da página inicial"
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
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
                name="aboutHeroImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem de fundo do Hero — Página Sobre Nós</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Aparece só no topo da página &ldquo;Sobre Nós&rdquo;. Independente da imagem da página
                      inicial acima. Formato paisagem funciona melhor (mais larga que alta).
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                        {field.value ? (
                          <Image
                            src={field.value}
                            alt="Imagem do Hero da página Sobre Nós"
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <ImageOff className="size-5" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleImageChange("aboutHeroImageUrl", e)}
                            disabled={uploadingField === "aboutHeroImageUrl"}
                          />
                        </FormControl>
                        {uploadingField === "aboutHeroImageUrl" ? (
                          <p className="text-xs text-muted-foreground">Enviando...</p>
                        ) : field.value ? (
                          <button
                            type="button"
                            onClick={() => form.setValue("aboutHeroImageUrl", "")}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3" /> Remover (volta pra imagem padrão)
                          </button>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Nenhuma — usando a mesma imagem da página inicial.
                          </p>
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
                    <p className="text-xs text-muted-foreground">
                      Aparece só na página &ldquo;Sobre Nós&rdquo;, na foto redonda ao lado do texto
                      institucional (aba &ldquo;Página Sobre Nós&rdquo; aqui ao lado). Formato quadrado
                      funciona melhor, já que a foto é cortada em círculo.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                        {field.value ? (
                          <Image
                            src={field.value}
                            alt="Imagem da Nossa História"
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
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
          </TabsContent>

          <TabsContent value="sobre" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Cada bloco abaixo é uma seção da página &ldquo;Sobre Nós&rdquo; do site, na mesma ordem em que
              aparecem lá. Clique pra abrir e editar — todos já vêm preenchidos com o texto que está no ar
              agora.
            </p>

            <FormField
              control={form.control}
              name="aboutText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto institucional (Quem somos)</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Seção &ldquo;Nossa História&rdquo;, logo no início da página, ao lado da foto redonda.
                  </p>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SettingsSection
              title="Números (Resultados em números)"
              description="3 números em destaque, logo abaixo de Nossa História."
            >
              <AboutStatsFields />
            </SettingsSection>

            <SettingsSection
              title="Missão, Visão, Valores e Propósito"
              description="Os 4 cards com ícone, um pra cada tema."
            >
              <AboutMissionValuesFields />
            </SettingsSection>

            <SettingsSection
              title="Nascemos através de uma palavra"
              description="Versículo-base, regra de vida, a placa invisível, lista de prioridades e os 3 cards de propósito."
            >
              <AboutFoundationsFields />
            </SettingsSection>

            <SettingsSection title="Nosso Diferencial" description="4 cards com o que diferencia a Bebiano.">
              <AboutItemListFields
                name="aboutDifferentiators"
                itemLabels={["Card 1", "Card 2", "Card 3", "Card 4"]}
              />
            </SettingsSection>

            <SettingsSection
              title="Como Trabalhamos"
              description="Os 5 passos, do primeiro contato às chaves na mão."
            >
              <AboutItemListFields
                name="aboutHowWeWork"
                itemLabels={["Passo 1", "Passo 2", "Passo 3", "Passo 4", "Passo 5"]}
              />
            </SettingsSection>

            <SettingsSection
              title="Nossos Valores"
              description="Os 6 valores em destaque, com numeração grande (01-06)."
            >
              <AboutItemListFields
                name="aboutValues"
                itemLabels={["Valor 01", "Valor 02", "Valor 03", "Valor 04", "Valor 05", "Valor 06"]}
              />
            </SettingsSection>

            <SettingsSection
              title="Por Que Escolher a Bebiano"
              description="Os 6 motivos, perto do fim da página."
            >
              <AboutItemListFields
                name="aboutWhyChoose"
                itemLabels={["Motivo 1", "Motivo 2", "Motivo 3", "Motivo 4", "Motivo 5", "Motivo 6"]}
              />
            </SettingsSection>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>
    </Form>
  )
}
