/**
 * Utility functions for permission checking and user permission loading
 */

import { getPermissionKey, isProtectedPage } from './permission-config';


export function parseAllowedPages(pages: any): string[] {
  if (Array.isArray(pages)) {
    return pages.map((page: string) => page.trim()).filter((page: string) => page.length > 0);
  } else if (typeof pages === 'string') {
    // ลอง parse เป็น JSON ก่อน
    try {
      const parsed = JSON.parse(pages);
      if (Array.isArray(parsed)) {
        return parsed.map((page: string) => page.trim()).filter((page: string) => page.length > 0);
      }
    } catch {
      // ถ้า parse ไม่ได้ แสดงว่าเป็น plain string
    }
    
    // ถ้ามี comma ให้ split เป็น array
    if (pages.includes(',')) {
      return pages.split(',').map((page: string) => page.trim()).filter((page: string) => page.length > 0);
    } else {
      // ถ้าไม่มี comma ให้แปลงเป็น array เดียว
      return [pages.trim()].filter((page: string) => page.length > 0);
    }
  }
  return [];
}

/**
 * Check if user has access to a specific page
 * @param allowedPages - Parsed allowed pages array
 * @param pagePath - The page path to check
 * @returns true if user has access
 */
export function checkPageAccess(allowedPages: string[], pagePath: string): boolean {
  if (!isProtectedPage(pagePath)) {
    return true; // ถ้าไม่ใช่ protected page ให้ผ่าน
  }
  
  const permissionKey = getPermissionKey(pagePath);
  if (!permissionKey) {
    return false;
  }
  
  // ตรวจสอบทั้ง path และ permission key
  return allowedPages.includes(pagePath) || allowedPages.includes(permissionKey);
}

/**
 * Load user permissions from API
 */
export async function loadUserPermissions(username: string): Promise<string[]> {
  try {
    const response = await fetch('/api/user/permissions', {
      headers: {
        'x-username': username,
        'x-user-id': '1',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return parseAllowedPages(data.allowedPages);
    }
    
    return [];
  } catch (error) {
    console.error('Error loading permissions:', error);
    return [];
  }
}

