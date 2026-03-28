/**
 * Formats a full filesystem path into a narub\... display path.
 *
 * Normalizes both the full path and homedir to backslashes before comparison,
 * then replaces the home directory prefix with "narub".
 *
 * If homedir is empty or the path does not start with homedir, returns the raw path.
 *
 * Examples:
 *   "C:\Users\narub\.openclaw\openclaw.json"  →  "narub\.openclaw\openclaw.json"
 *   "C:/Users/narub/.openclaw/openclaw.json"  →  "narub\.openclaw\openclaw.json"
 */
export function formatPath(fullPath: string, homedir: string): string {
  if (!homedir) return fullPath

  // Normalize both to backslashes for comparison
  const normalizedPath = fullPath.replace(/\//g, '\\')
  const normalizedHome = homedir.replace(/\//g, '\\')

  // Strip trailing backslash from home (in case it was provided with one)
  const home = normalizedHome.endsWith('\\')
    ? normalizedHome.slice(0, -1)
    : normalizedHome

  if (normalizedPath.toLowerCase().startsWith(home.toLowerCase())) {
    const rest = normalizedPath.slice(home.length)
    // rest starts with '\' or is empty — prepend "narub"
    const suffix = rest.startsWith('\\') ? rest : `\\${rest}`
    return `narub${suffix}`
  }

  return fullPath
}
