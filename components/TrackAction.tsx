'use client';

interface Props {
  songId: string;
  action: 'play' | 'download' | 'like';
  href?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  download?: boolean;
}

export default function TrackAction({ songId, action, href, children, style, title, download: isDownload }: Props) {
  const handleClick = () => {
    // Fire-and-forget tracking
    fetch(`/api/songs/${songId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{ ...style, textDecoration: 'none' }}
        title={title}
        {...(isDownload ? { download: '' } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={handleClick} style={{ ...style, border: 'none', cursor: 'pointer' }} title={title}>
      {children}
    </button>
  );
}
