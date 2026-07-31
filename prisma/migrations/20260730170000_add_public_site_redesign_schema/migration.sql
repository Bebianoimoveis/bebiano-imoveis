-- Repaginação do site público: campos de "Lançamento" em Property e novo
-- model Testimonial (depoimentos gerenciados pelo admin).

ALTER TABLE "Property"
  ADD COLUMN "isLaunch" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "launchDeliveryAt" TIMESTAMP(3);

CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "message" TEXT NOT NULL,
  "photoUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonial_published_order_idx" ON "Testimonial"("published", "order");

-- Nova permissão "testimonial.manage" (ver prisma/seed.ts, concedida a
-- ADMIN e MANAGER) é criada pelo seed idempotente, não aqui — rodar
-- `npm run db:seed` após esta migração, em dev e produção.
