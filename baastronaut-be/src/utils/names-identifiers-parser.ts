const NAME_REGEX = /^[^\d][\w\s-]+$/g;
const IDENTIFIER_REGEX = /^[^\d][a-z0-9_]+$/g;
const MAX_LENGTH = 63;

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return (
    !!(trimmed && trimmed.match(NAME_REGEX)) && trimmed.length <= MAX_LENGTH
  );
}

export function isValidIdentifier(identifier: string): boolean {
  return (
    !!identifier.match(IDENTIFIER_REGEX) && identifier.length <= MAX_LENGTH
  );
}

export function nameToPostgresIdentifier(name: string): string {
  if (!isValidName(name)) {
    throw new Error(
      `${name} contains invalid characters, is not a valid name.`,
    );
  }

  const res = name.trim().toLowerCase().replace(/[^\w]/g, '_');
  if (!isValidIdentifier(res)) {
    throw new Error(
      `Unexpected error: converted result is still not a valid identifier: ${res}`,
    );
  }
  return res;
}
