import { Header } from "@/components/public/header"
import { Footer } from "@/components/public/footer"
import { WhatsAppButton } from "@/components/public/whatsapp-button"
import { PageMain } from "@/components/public/page-main"
import { MobileTabBar } from "@/components/public/mobile-tab-bar"
import { getPublicRentalEnabled } from "@/modules/settings/actions"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rentalEnabled = await getPublicRentalEnabled()

  return (
    <div className="flex min-h-screen flex-col">
      <Header rentalEnabled={rentalEnabled} />
      <PageMain>{children}</PageMain>
      <Footer rentalEnabled={rentalEnabled} />
      <WhatsAppButton />
      <MobileTabBar />
    </div>
  )
}
