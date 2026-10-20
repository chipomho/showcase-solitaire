/** Joins the truthy class names. Small enough not to need a package. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
