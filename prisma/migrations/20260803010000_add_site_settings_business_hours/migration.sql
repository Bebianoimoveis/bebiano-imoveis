-- Horário de funcionamento (texto livre) exibido na seção de Localização
-- da nova página "Sobre Nós" do site público.

ALTER TABLE "SiteSettings" ADD COLUMN "businessHours" TEXT;
