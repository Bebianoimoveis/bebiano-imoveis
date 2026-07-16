"use server"

import { auth } from "@/lib/auth"
import { cloudinary } from "@/lib/cloudinary"

const ALLOWED_FORMATS = "jpg,jpeg,png,webp"
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB

export type UploadSignature = {
  timestamp: number
  signature: string
  apiKey: string
  cloudName: string
  folder: string
  allowedFormats: string
  maxFileSize: number
}

// Gera uma assinatura de upload de curta duração para que o browser envie
// a imagem diretamente ao Cloudinary (o servidor nunca recebe o binário,
// apenas a URL resultante é persistida no banco).
export async function createPropertyImageUploadSignature(): Promise<UploadSignature> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Não autenticado.")
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = "bebiano-imoveis/properties"

  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: ALLOWED_FORMATS,
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  )

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    maxFileSize: MAX_FILE_SIZE_BYTES,
  }
}
