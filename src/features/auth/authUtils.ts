export const ALLOWED_EMAIL_DOMAIN = '@muj.manipal.edu';

export function isAllowedUniversityEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(ALLOWED_EMAIL_DOMAIN);
}
