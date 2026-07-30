-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('VISIT', 'CALL', 'RETURN', 'OTHER');

-- AlterTable
ALTER TABLE "Appointment"
  ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "type" "AppointmentType" NOT NULL DEFAULT 'VISIT';
