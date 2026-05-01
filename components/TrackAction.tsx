'use client';

interface Props {
  songId: string;
  action: 'play' | 'download' | 'like';
  href?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  download?: boolean;
}

export default function TrackAction({ songId, action, href, children, className, style, title, download: isDownload }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    if (action === 'download' && isDownload) {
      // Use the download API which embeds cover art + forces download
      e.preventDefault();
      window.open(href || `/api/songs/${songId}/download`, '_blank');
      return;
    }

    // Fire-and-forget tracking for play/like
    fetch(`/api/songs/${songId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  };

  if (href) {
    return (
      <a
        href={action === 'download' && isDownload ? '#' : href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={className}
        style={{ ...style, textDecoration: 'none' }}
        title={title}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={handleClick} className={className} style={{ ...style, border: 'none', cursor: 'pointer' }} title={title}>
      {children}
    </button>
  );
}
