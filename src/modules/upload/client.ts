import type { UploadSignature } from "@/modules/upload/actions"

export type UploadedImage = {
  url: string
  publicId: string
}

// Envia o arquivo diretamente para o Cloudinary usando uma assinatura
// gerada no servidor (ver createPropertyImageUploadSignature). O binário
// nunca passa pelo nosso backend.
export async function uploadPropertyImage(
  file: File,
  signature: UploadSignature
): Promise<UploadedImage> {
  if (file.size > signature.maxFileSize) {
    throw new Error("Arquivo excede o tamanho máximo permitido (8MB).")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", signature.apiKey)
  formData.append("timestamp", String(signature.timestamp))
  formData.append("signature", signature.signature)
  formData.append("folder", signature.folder)
  formData.append("allowed_formats", signature.allowedFormats)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: "POST", body: formData }
  )

  if (!response.ok) {
    throw new Error("Falha ao enviar imagem para o Cloudinary.")
  }

  const data = (await response.json()) as { secure_url: string; public_id: string }

  return { url: data.secure_url, publicId: data.public_id }
}
