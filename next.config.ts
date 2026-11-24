import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Cabeçalhos de segurança ausentes até agora (nenhum era enviado por
  // padrão) — mitigam clickjacking, MIME-sniffing e vazamento de URL via
  // Referer em links externos. CSP fica de fora de propósito: o site usa
  // scripts inline (Next.js) e recursos de vários domínios (Cloudinary,
  // fontes), então um CSP mal calibrado quebraria a aplicação; a defesa
  // contra XSS aqui é não usar dangerouslySetInnerHTML em lugar nenhum
  // (confirmado por varredura) em vez de depender só de CSP.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          // Parte do CSP que não depende de scripts/imagens: ninguém embute
          // o site em outro, nem troca a base dos links ou usa plugins.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
