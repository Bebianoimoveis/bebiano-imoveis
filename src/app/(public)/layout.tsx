import { Header } from "@/components/public/header"
import { Footer } from "@/components/public/footer"
import { WhatsAppButton } from "@/components/public/whatsapp-button"
import { PageMain } from "@/components/public/page-main"
import { MobileTabBar } from "@/components/public/mobile-tab-bar"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PageMain>{children}</PageMain>
      <Footer />
      <WhatsAppButton />
      <MobileTabBar />
    </div>
  )
}
