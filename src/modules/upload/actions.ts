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

const ATTACHMENT_ALLOWED_FORMATS = "pdf,jpg,jpeg,png"
const ATTACHMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

// Mesmo esquema de assinatura acima, mas para o comprovante/nota fiscal de
// um lançamento financeiro (resource_type: raw, aceita PDF além de
// imagem) — extensão do padrão já usado em Contract.fileUrl.
export async function createFinancialAttachmentUploadSignature(): Promise<UploadSignature> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Não autenticado.")
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = "bebiano-imoveis/financeiro"

  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: ATTACHMENT_ALLOWED_FORMATS,
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
    allowedFormats: ATTACHMENT_ALLOWED_FORMATS,
    maxFileSize: ATTACHMENT_MAX_FILE_SIZE_BYTES,
  }
}
