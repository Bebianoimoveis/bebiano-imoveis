import QRCode from "qrcode"
import { Link2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { CopyLinkButton } from "@/components/admin/realtors/copy-link-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listRealtorLinkStats } from "@/modules/attribution/actions"
import { siteConfig } from "@/config/site"

export default async function RealtorLinksPage() {
  const stats = await listRealtorLinkStats()

  const rows = await Promise.all(
    stats.map(async (realtor) => {
      const link = `${siteConfig.url}/?ref=${realtor.slug}`
      const qrCode = await QRCode.toDataURL(link, { width: 96, margin: 1 })
      return { ...realtor, link, qrCode }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Links dos Corretores
        </h1>
        <p className="text-sm text-muted-foreground">
          Cada corretor tem um link próprio para divulgar — visitantes que
          entram por ele ficam atribuídos àquele corretor por 30 dias.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="Nenhum corretor ativo"
          description="Cadastre corretores para gerar os links de divulgação."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead>Último acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((realtor) => (
                <TableRow key={realtor.id}>
                  <TableCell className="font-medium">{realtor.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="max-w-56 truncate text-xs text-muted-foreground">
                        {realtor.link}
                      </code>
                      <CopyLinkButton link={realtor.link} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URI gerada no servidor, não faz sentido passar pelo otimizador de imagens */}
                    <img
                      src={realtor.qrCode}
                      alt={`QR Code do link de ${realtor.name}`}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="text-right">{realtor.visits}</TableCell>
                  <TableCell className="text-right">{realtor.leads}</TableCell>
                  <TableCell className="text-right">{realtor.sales}</TableCell>
                  <TableCell className="text-right">
                    {(realtor.conversion * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {realtor.lastAccess
                      ? realtor.lastAccess.toLocaleDateString("pt-BR")
                      : "—"}
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
