/**
 * Marks the end of an exhaustive switch. The compiler rejects the call if a case is
 * missing; at runtime it only fires if something untyped (a cast, bad data) slips through.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
