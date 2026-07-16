"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PropertyImageUploader } from "@/components/admin/properties/property-image-uploader"
import { createProperty, updateProperty } from "@/modules/property/actions"
import { listNeighborhoods } from "@/modules/taxonomy/actions"
import {
  propertyInputSchema,
  type PropertyFormValues,
  type PropertyInput,
} from "@/modules/property/schema"

// Campos numéricos usam z.coerce, cujo tipo de entrada é "unknown" — os
// inputs precisam de um valor string/number explícito para o React controlar.
function toInputValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value)
}

type Option = { id: string; name: string }
type CityOption = Option & { state: string }
type RealtorOption = { id: string; user: { name: string } }
type ImageItem = { id: string; url: string; isCover: boolean }

type PropertyFormProps = {
  mode: "create" | "edit"
  propertyId?: string
  defaultValues: PropertyFormValues
  cities: CityOption[]
  initialNeighborhoods: Option[]
  propertyTypes: Option[]
  features: Option[]
  realtors: RealtorOption[]
  images?: ImageItem[]
}

export function PropertyForm({
  mode,
  propertyId,
  defaultValues,
  cities,
  initialNeighborhoods,
  propertyTypes,
  features,
  realtors,
  images,
}: PropertyFormProps) {
  const router = useRouter()
  const [neighborhoods, setNeighborhoods] = useState(initialNeighborhoods)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PropertyFormValues, unknown, PropertyInput>({
    resolver: zodResolver(propertyInputSchema),
    defaultValues,
  })

  async function handleCityChange(cityId: string) {
    form.setValue("cityId", cityId)
    form.setValue("neighborhoodId", "")
    const list = await listNeighborhoods(cityId)
    setNeighborhoods(list)
  }

  async function onSubmit(values: PropertyInput) {
    setIsSubmitting(true)
    try {
      if (mode === "create") {
        const property = await createProperty(values)
        toast.success("Imóvel cadastrado como rascunho.")
        router.push(`/admin/imoveis/${property.id}`)
      } else if (propertyId) {
        await updateProperty(propertyId, values)
        toast.success("Imóvel atualizado.")
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar imóvel.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="localizacao">Localização</TabsTrigger>
            <TabsTrigger value="caracteristicas">Características</TabsTrigger>
            <TabsTrigger value="imagens" disabled={mode === "create"}>
              Imagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finalidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALE">Venda</SelectItem>
                        <SelectItem value="RENT">Locação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo do imóvel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={toInputValue(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="condoFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condomínio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={toInputValue(field.value)}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="iptu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IPTU</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={toInputValue(field.value)}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="realtorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corretor responsável</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {realtors.map((realtor) => (
                        <SelectItem key={realtor.id} value={realtor.id}>
                          {realtor.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="localizacao" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <Select onValueChange={handleCityChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name} - {city.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neighborhoodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {neighborhoods.map((neighborhood) => (
                          <SelectItem key={neighborhood.id} value={neighborhood.id}>
                            {neighborhood.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="addressVisibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibilidade do endereço no site</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FULL">Endereço completo</SelectItem>
                      <SelectItem value="APPROXIMATE">
                        Localização aproximada
                      </SelectItem>
                      <SelectItem value="NEIGHBORHOOD_ONLY">
                        Somente bairro e cidade
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="caracteristicas" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quartos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={toInputValue(field.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suítes</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={toInputValue(field.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banheiros</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={toInputValue(field.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parkingSpots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vagas</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={toInputValue(field.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="builtArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área construída (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={toInputValue(field.value)}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área total (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={toInputValue(field.value)}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["acceptsFinancing", "Aceita financiamento"],
                  ["acceptsFgts", "Aceita FGTS"],
                  ["furnished", "Mobiliado"],
                  ["gatedCommunity", "Condomínio fechado"],
                  ["featured", "Imóvel em destaque"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={Boolean(field.value)}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded border-border"
                        />
                      </FormControl>
                      <Label className="font-normal">{label}</Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {features.length > 0 ? (
              <FormField
                control={form.control}
                name="featureIds"
                render={({ field }) => {
                  const selected = (field.value as string[] | undefined) ?? []
                  return (
                    <FormItem>
                      <FormLabel>Características do imóvel</FormLabel>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {features.map((feature) => (
                          <label
                            key={feature.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-border"
                              checked={selected.includes(feature.id)}
                              onChange={(e) => {
                                field.onChange(
                                  e.target.checked
                                    ? [...selected, feature.id]
                                    : selected.filter((id) => id !== feature.id)
                                )
                              }}
                            />
                            {feature.name}
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            ) : null}

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vídeo (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="imagens">
            {propertyId ? (
              <PropertyImageUploader
                propertyId={propertyId}
                images={images ?? []}
              />
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
