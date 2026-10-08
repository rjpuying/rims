const PREFIXES: [string, string][] = [
  ["VALIDATION: ", ""],
  ["INSUFFICIENT_INVENTORY: ", ""],
  ["FORBIDDEN: ", "You do not have permission to perform this action. "],
  ["NOT_AUTHENTICATED: ", "Your session has expired. Please sign in again. "],
];

export function friendlyError(
  raw: string,
  fallback = "Unable to complete the request. Please try again.",
): string {
  for (const [prefix, replacement] of PREFIXES) {
    if (raw.startsWith(prefix)) {
      return replacement + raw.slice(prefix.length);
    }
  }
  if (/permission|forbidden/i.test(raw)) {
    return raw;
  }
  return fallback;
}
