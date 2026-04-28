'use client';

import { IMediaItem } from '@/models/Post';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
  mediaItems: IMediaItem[];
}

/**
 * Renders article body content, replacing [image:N] markers with actual inline images.
 * Image 1 is the cover (shown by MediaBlock), so inline images start from [image:2].
 */
export default function InlineArticleBody({ content, mediaItems }: Props) {
  const photos = (mediaItems || []).filter(m => m.type === 'photo').sort((a, b) => a.order - b.order);

  // Split the content by [image:N] markers
  const parts = content.split(/(\[image:\d+\])/gi);

  const mdComponents = {
    blockquote: ({ children }: any) => <div className="pull-quote"><p>{children}</p></div>,
    p: ({ children }: any) => <p>{children}</p>,
  };

  return (
    <>
      {parts.map((part, idx) => {
        // Check if this part is an [image:N] marker
        const match = part.match(/^\[image:(\d+)\]$/i);
        if (match) {
          const imageIndex = parseInt(match[1], 10) - 1; // convert to 0-based
          const photo = photos[imageIndex];
          if (photo) {
            return (
              <div key={idx} style={{ margin: '24px 0', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                <img
                  src={photo.url}
                  alt={photo.caption || `Image ${imageIndex + 1}`}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                />
                {photo.caption && (
                  <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', padding: '8px 12px', margin: 0 }}>{photo.caption}</p>
                )}
              </div>
            );
          }
          // If image not found, render nothing
          return null;
        }

        // Regular text — render as markdown
        if (part.trim()) {
          return (
            <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]} components={mdComponents}>
              {part}
            </ReactMarkdown>
          );
        }
        return null;
      })}
    </>
  );
}
