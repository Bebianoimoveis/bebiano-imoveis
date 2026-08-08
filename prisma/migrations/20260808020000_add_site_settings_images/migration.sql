-- Imagens de marca editáveis pelo admin (Hero e "Nossa História"), em vez
-- de arquivo fixo/derivado de foto de corretor.

ALTER TABLE "SiteSettings"
  ADD COLUMN "heroImageUrl" TEXT,
  ADD COLUMN "aboutStoryImageUrl" TEXT;
