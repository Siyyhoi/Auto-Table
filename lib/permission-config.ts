/**
 * Configuration for pages that require permission checks
 * เพิ่มหน้าใหม่ที่นี่เพื่อให้ระบบตรวจสอบสิทธิ์อัตโนมัติ
 */

export const PROTECTED_PAGES = {
  '/schedule': 'Schedule',
  '/permission': 'Permission',
  // เพิ่มหน้าใหม่ที่นี่
  // '/new-page': 'NewPage',
} as const;

export function getPermissionKey(pagePath: string): string | null {
  return PROTECTED_PAGES[pagePath as keyof typeof PROTECTED_PAGES] || null;
}

export function isProtectedPage(pagePath: string): boolean {
  return pagePath in PROTECTED_PAGES;
}

export function getProtectedPagePaths(): string[] {
  return Object.keys(PROTECTED_PAGES);
}

