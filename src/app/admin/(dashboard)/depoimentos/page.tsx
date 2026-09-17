import QRCode from "qrcode"
import { Plus, MessageSquareQuote, Star, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { CopyLinkButton } from "@/components/admin/realtors/copy-link-button"
import { QrCodeCell } from "@/components/admin/realtors/qr-code-cell"
import { TestimonialFormDialog } from "@/components/admin/testimonials/testimonial-form-dialog"
import { TestimonialDeleteButton } from "@/components/admin/testimonials/testimonial-delete-button"
import { TestimonialPublishToggle } from "@/components/admin/testimonials/testimonial-publish-toggle"
import { listAdminTestimonials, listRealtorReviewLinks } from "@/modules/testimonial/actions"
import { siteConfig } from "@/config/site"

export default async function AdminTestimonialsPage() {
  const [testimonials, realtorLinks] = await Promise.all([
    listAdminTestimonials(),
    listRealtorReviewLinks(),
  ])

  const reviewLinks = await Promise.all(
    realtorLinks.map(async (realtor) => {
      const link = `${siteConfig.url}/avaliar/${realtor.slug}`
      const qrCode = await QRCode.toDataURL(link, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      return { ...realtor, link, qrCode }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Depoimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Depoimentos de clientes exibidos na home do site público.
          </p>
        </div>
        <TestimonialFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo depoimento
            </Button>
          }
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Links de Avaliação</h2>
          <p className="text-sm text-muted-foreground">
            Cada corretor tem um link próprio pra pedir avaliação ao cliente — a resposta cai na lista abaixo,
            oculta até você escolher publicar.
          </p>
        </div>

        {reviewLinks.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Nenhum corretor ativo"
            description="Cadastre corretores para gerar os links de avaliação."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="text-right">Depoimentos recebidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewLinks.map((realtor) => (
                  <TableRow key={realtor.id}>
                    <TableCell className="font-medium">{realtor.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="max-w-56 truncate text-xs text-muted-foreground">{realtor.link}</code>
                        <CopyLinkButton link={realtor.link} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <QrCodeCell name={realtor.name} link={realtor.link} qrCode={realtor.qrCode} />
                    </TableCell>
                    <TableCell className="text-right">{realtor.totalReviews}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Nenhum depoimento cadastrado"
          description="Cadastre depoimentos de clientes para exibir na home do site."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Depoimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-64" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">{testimonial.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {testimonial.realtor?.user.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {testimonial.city ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-0.5 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="size-3.5"
                          fill={i < testimonial.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    <p className="truncate">{testimonial.message}</p>
                    {testimonial.highlight ? (
                      <p className="mt-0.5 truncate text-xs italic">Destaque: {testimonial.highlight}</p>
                    ) : null}
                    {testimonial.improvementNotes ? (
                      <p className="mt-0.5 truncate text-xs text-amber-600">
                        Sugestão: {testimonial.improvementNotes}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        testimonial.published
                          ? "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                          : "border-transparent bg-muted text-muted-foreground"
                      }
                    >
                      {testimonial.published ? "Publicado" : "Oculto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <TestimonialPublishToggle id={testimonial.id} published={testimonial.published} />
                    <TestimonialFormDialog
                      mode="edit"
                      testimonialId={testimonial.id}
                      defaultValues={{
                        name: testimonial.name,
                        city: testimonial.city,
                        rating: testimonial.rating,
                        message: testimonial.message,
                        photoUrl: testimonial.photoUrl,
                        published: testimonial.published,
                        order: testimonial.order,
                      }}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                    <TestimonialDeleteButton id={testimonial.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
