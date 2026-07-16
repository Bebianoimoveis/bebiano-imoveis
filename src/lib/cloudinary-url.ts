import { buildImageUrl } from "cloudinary-build-url"

// Gera URLs otimizadas (formato/qualidade automáticos) a partir do publicId
// salvo no banco, sem precisar guardar múltiplas variações da mesma imagem.
export function getOptimizedImageUrl(
  publicId: string,
  options?: { width?: number; height?: number }
) {
  return buildImageUrl(publicId, {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
    transformations: {
      quality: "auto",
      format: "auto",
      ...(options?.width ? { width: options.width } : {}),
      ...(options?.height ? { height: options.height } : {}),
      crop: options?.width || options?.height ? "fill" : undefined,
    },
  })
}
