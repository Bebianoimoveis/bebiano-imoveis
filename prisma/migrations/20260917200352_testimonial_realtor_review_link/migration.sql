-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "realtorId" TEXT,
ADD COLUMN     "highlight" TEXT,
ADD COLUMN     "improvementNotes" TEXT;

-- CreateIndex
CREATE INDEX "Testimonial_realtorId_idx" ON "Testimonial"("realtorId");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
