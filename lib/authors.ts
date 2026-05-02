export function getAuthorDisplay(author?: string, profileImageUrl?: string | null) {
  const normalizedAuthor = author?.trim();

  let name = normalizedAuthor || 'Jalal';
  
  if (!normalizedAuthor) {
    name = 'Jalal';
  } else if (normalizedAuthor.toLowerCase() === 'co-friend') {
    name = 'Co-friend';
  } else if (['admin', 'main admin', 'administrator'].includes(normalizedAuthor.toLowerCase())) {
    name = 'Cyber';
  } else {
    name = normalizedAuthor
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  const initials =
    name
      .split(/[\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || name.slice(0, 2).toUpperCase();

  return { name, initials, profileImageUrl };
}
