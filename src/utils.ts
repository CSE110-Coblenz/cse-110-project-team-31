/**
 * Utility function to get asset paths that work with Vite's base path
 * This ensures assets load correctly both locally and on GitHub Pages
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Vite's import.meta.env.BASE_URL already includes the trailing slash
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  return `${baseUrl}${cleanPath}`;
}

