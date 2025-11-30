/**
 * Permission utilities for checking user access to pages
 */

/**
 * Routes that are accessible to all authenticated users (default access)
 */
const DEFAULT_ACCESSIBLE_ROUTES = ['/', '/help'];

/**
 * Checks if a user has permission to access a specific page
 * @param allowedPages - Array of allowed page routes from user's permission
 * @param targetPage - The page route to check access for
 * @returns true if user has access, false otherwise
 */
export function hasPageAccess(allowedPages: string[], targetPage: string): boolean {
  // Always allow access to default routes (Dashboard and Help)
  if (DEFAULT_ACCESSIBLE_ROUTES.includes(targetPage)) return true;
  
  if (!allowedPages || !Array.isArray(allowedPages)) return false;
  return allowedPages.includes(targetPage);
}

/**
 * Filters menu items based on user permissions
 * @param menuItems - Array of menu items with href property
 * @param allowedPages - Array of allowed page routes
 * @returns Filtered menu items user has access to
 */
export function filterMenuByPermission(
  menuItems: Array<{ name: string; href: string; icon?: React.ReactNode }>,
  allowedPages: string[]
): Array<{ name: string; href: string; icon?: React.ReactNode }> {
  return menuItems.filter(item => hasPageAccess(allowedPages, item.href));
}

/**
 * Gets default permissions (guest/unauthenticated user - no access to any pages)
 */
export function getGuestPermissions(): string[] {
  return [];
}

/**
 * Gets all available permissions in the system
 */
export const AVAILABLE_ROUTES = [
  { path: '/', name: 'Dashboard' },
  { path: '/schedule', name: 'Schedule' },
  { path: '/help', name: 'Help' },
];
