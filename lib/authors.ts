export function getAuthorDisplay(author?: string) {
  const normalizedAuthor = author?.trim();

  if (!normalizedAuthor) {
    return { name: 'Jalal', initials: 'JA' };
  }

  if (normalizedAuthor.toLowerCase() === 'co-friend') {
    return { name: 'Co-friend', initials: 'CO' };
  }

  const name = normalizedAuthor
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const initials =
    name
      .split(/[\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || name.slice(0, 2).toUpperCase();

  return { name, initials };
}
