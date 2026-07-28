// Nome do cookie httpOnly que aponta pro visitante atribuído. O valor
// guardado é só o `visitorId` opaco (nunca o realtorId) — a resolução do
// corretor responsável sempre passa pelo banco, nunca confia no cookie
// em si além de ser um ponteiro.
export const REFERRAL_COOKIE_NAME = "bebiano_ref"

export const REFERRAL_WINDOW_DAYS = 30
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = REFERRAL_WINDOW_DAYS * 24 * 60 * 60
