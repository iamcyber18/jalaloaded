'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthorDisplay } from '@/lib/authors';
import { timeAgo } from '@/lib/utils';

export type HeroCarouselSlide = {
  author: string;
  category: string;
  createdAt: string;
  featured?: boolean;
  id: string;
  imageUrl?: string | null;
  slug: string;
  title: string;
  authorProfilePic?: string | null;
};

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="hero-carousel-nav-icon"
      aria-hidden="true"
    >
      {direction === 'left' ? (
        <path d="m14.5 5.5-6 6 6 6" />
      ) : (
        <path d="m9.5 5.5 6 6-6 6" />
      )}
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function formatSlideCount(value: number) {
  return value.toString().padStart(2, '0');
}

export default function HeroCarousel({ slides }: { slides: HeroCarouselSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedSlideId, setCopiedSlideId] = useState<string | null>(null);

  const safeActiveIndex = activeIndex >= slides.length ? 0 : activeIndex;
  const currentSlide = slides[safeActiveIndex];
  const currentAuthor = currentSlide ? getAuthorDisplay(currentSlide.author) : null;

  const stepSlides = (step: number) => {
    setActiveIndex((current) => {
      if (slides.length <= 1) {
        return 0;
      }

      return (current + step + slides.length) % slides.length;
    });
  };

  useEffect(() => {
    if (!copiedSlideId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedSlideId(null);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [copiedSlideId]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [isPaused, slides.length]);

  if (!currentSlide) {
    return null;
  }

  const handleSelectSlide = (index: number) => {
    setActiveIndex(index);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/blog/${currentSlide.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentSlide.title,
          url: shareUrl,
        });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedSlideId(currentSlide.id);
    } catch {
      setCopiedSlideId(null);
    }
  };

  return (
    <section
      className="hero hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-carousel-panel ${index === safeActiveIndex ? 'active' : ''}`}
          aria-hidden={index === safeActiveIndex ? 'false' : 'true'}
        >
          <div className="hero-img-bg">
            <div className="hero-pattern"></div>
            {slide.imageUrl && (
              <>
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'cover', opacity: 0.4, filter: 'blur(30px)', transform: 'scale(1.1)' }}
                  priority={index === 0}
                />
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'contain', opacity: 0.95 }}
                  priority={index === 0}
                />
              </>
            )}
          </div>
          <div className="hero-overlay"></div>
          <div className="hero-carousel-glow"></div>
        </div>
      ))}

      <Link
        href={`/blog/${currentSlide.slug}`}
        className="hero-carousel-hit"
        aria-label={`Open ${currentSlide.title}`}
      />

      <div className="hero-carousel-watermark" aria-hidden="true">
        <span>JALA</span>
        <span>LOAD</span>
        <span>ED</span>
      </div>

      <div className="hero-content hero-carousel-content">
        <div className="hero-carousel-copy">
          <div className="hero-carousel-kicker">
            <span className="hero-badge">{currentSlide.featured ? 'FEATURED POST' : 'TOP STORY'}</span>
            <span className="hero-carousel-kicker-text">{currentSlide.category}</span>
          </div>

          <div className="hero-title">{currentSlide.title}</div>

          <div className="hero-meta">
            <div 
              className="hero-av"
              style={{ 
                background: currentSlide.authorProfilePic ? `url(${currentSlide.authorProfilePic}) center/cover` : 'var(--orange)',
                color: currentSlide.authorProfilePic ? 'transparent' : '#fff'
              }}
            >
              {!currentSlide.authorProfilePic && (currentAuthor?.initials || 'JA')}
            </div>
            <span className="hero-author">By {currentAuthor?.name || 'Jalal'}</span>
            <span className="hero-date">{timeAgo(currentSlide.createdAt)} &bull; 5 min read</span>
          </div>

          <div className="hero-actions">
            <Link href={`/blog/${currentSlide.slug}`} className="hero-btn hero-btn-primary">
              Read Full Post
            </Link>
            <button type="button" className="hero-btn hero-btn-ghost" onClick={handleShare}>
              <ShareIcon />
              {copiedSlideId === currentSlide.id ? 'Link Copied' : 'Share'}
            </button>
          </div>

          {slides.length > 1 && (
            <div className="hero-carousel-dots" aria-label="Carousel slides">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`hero-carousel-dot ${index === safeActiveIndex ? 'active' : ''}`}
                  onClick={() => handleSelectSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-pressed={index === safeActiveIndex}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
