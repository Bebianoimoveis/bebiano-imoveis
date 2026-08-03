import { z } from "zod"

import { SEGMENT_ICON_NAMES } from "@/lib/segment-icons"

export const segmentInputSchema = z.object({
  name: z.string().min(2, "Informe o nome do segmento."),
  active: z.coerce.boolean().default(true),
  order: z.coerce.number().int().default(0),
  icon: z.enum(SEGMENT_ICON_NAMES as [string, ...string[]]).default("Home"),
  imageUrl: z.string().optional(),
  propertyTypeId: z.string().optional(),
  purpose: z.enum(["SALE", "RENT"]).optional(),
  isLaunch: z.coerce.boolean().default(false),
  gatedCommunity: z.coerce.boolean().default(false),
  minPrice: z.coerce.number().nonnegative().optional(),
})

export type SegmentFormValues = z.input<typeof segmentInputSchema>
export type SegmentInput = z.output<typeof segmentInputSchema>
