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

// Mesmo esquema de assinatura acima, pra foto de perfil do corretor
// (painel Corretores e página pública /corretores/[slug]).
export async function createRealtorPhotoUploadSignature(): Promise<UploadSignature> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Não autenticado.")
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = "bebiano-imoveis/corretores"

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

const SUBMISSION_ALLOWED_FORMATS = "jpg,jpeg,png,webp"
const SUBMISSION_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB

// Sem checagem de sessão de propósito: usado pelo formulário público
// "Quero vender meu imóvel" (src/app/(public)/anunciar), preenchido por
// visitantes sem conta. Pasta e formatos restritos (só imagem) limitam o
// uso indevido da assinatura.
export async function createSubmissionImageUploadSignature(): Promise<UploadSignature> {
  const timestamp = Math.round(Date.now() / 1000)
  const folder = "bebiano-imoveis/captacao"

  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: SUBMISSION_ALLOWED_FORMATS,
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
    allowedFormats: SUBMISSION_ALLOWED_FORMATS,
    maxFileSize: SUBMISSION_MAX_FILE_SIZE_BYTES,
  }
}
