import { Header } from "@/components/public/header"
import { Footer } from "@/components/public/footer"
import { WhatsAppButton } from "@/components/public/whatsapp-button"
import { PageMain } from "@/components/public/page-main"
import { MobileTabBar } from "@/components/public/mobile-tab-bar"
import { getPublicRentalEnabled, getPublicContactInfo } from "@/modules/settings/actions"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [rentalEnabled, contactInfo] = await Promise.all([
    getPublicRentalEnabled(),
    getPublicContactInfo(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header rentalEnabled={rentalEnabled} email={contactInfo.email} instagram={contactInfo.instagram} />
      <PageMain>{children}</PageMain>
      <Footer rentalEnabled={rentalEnabled} email={contactInfo.email} instagram={contactInfo.instagram} />
      <WhatsAppButton />
      <MobileTabBar email={contactInfo.email} instagram={contactInfo.instagram} />
    </div>
  )
}
