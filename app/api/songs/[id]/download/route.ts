import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import NodeID3 from 'node-id3';
import sharp from 'sharp';

const LOGO_URL = 'https://jalaloaded.vercel.app/images/jalaloadedlogo.png';

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Overlay the Jalaloaded logo onto the cover art (bottom-right corner).
 * If no cover art, use logo on a branded background.
 */
async function buildCoverImage(coverBuffer: Buffer | null, logoBuffer: Buffer): Promise<Buffer> {
  if (coverBuffer) {
    // Resize cover to 500x500, then overlay logo at bottom-right
    const cover = sharp(coverBuffer).resize(500, 500, { fit: 'cover' });
    const logoResized = await sharp(logoBuffer)
      .resize(100, 100, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return cover
      .composite([{
        input: logoResized,
        gravity: 'southeast',
      }])
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    // No cover art: create a branded dark background with centered logo
    const logoResized = await sharp(logoBuffer)
      .resize(250, 250, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return sharp({
      create: { width: 500, height: 500, channels: 4, background: { r: 18, g: 18, b: 18, alpha: 255 } }
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .jpeg({ quality: 90 })
      .toBuffer();
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();

    const song = await Song.findByIdAndUpdate(
      resolvedParams.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const isVideoDownload = searchParams.get('type') === 'video';

    const targetUrl = isVideoDownload ? song.videoUrl : (song.downloadUrl || song.mediaUrl);
    if (!targetUrl) {
      return NextResponse.json({ error: isVideoDownload ? 'No video file' : 'No audio file' }, { status: 404 });
    }

    if (isVideoDownload && (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be'))) {
      return NextResponse.json({ error: 'Cannot download YouTube videos directly' }, { status: 400 });
    }

    // Fetch the target file
    const fileRes = await fetch(targetUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
    }

    let fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    const contentType = fileRes.headers.get('content-type') || (isVideoDownload ? 'video/mp4' : 'audio/mpeg');
    const isMP3 = !isVideoDownload && (contentType.includes('mpeg') || targetUrl.includes('.mp3'));

    if (isMP3) {
      try {
        // Fetch logo (always needed)
        const logoBuffer = await fetchBuffer(LOGO_URL);

        // Fetch artist cover art if available
        const coverBuffer = song.coverUrl ? await fetchBuffer(song.coverUrl) : null;

        // Build final cover image with logo overlay
        let finalCoverBuffer: Buffer | null = null;
        if (logoBuffer) {
          finalCoverBuffer = await buildCoverImage(coverBuffer, logoBuffer);
        } else if (coverBuffer) {
          finalCoverBuffer = coverBuffer;
        }

        const tags: any = {
          title: song.title,
          artist: song.artist,
          album: 'Jalaloaded',
          year: String(song.year || new Date().getFullYear()),
          genre: song.genre,
          comment: { language: 'eng', text: song.description || 'Downloaded from Jalaloaded.com' },
        };

        if (finalCoverBuffer) {
          tags.image = {
            mime: 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            description: 'Cover',
            imageBuffer: finalCoverBuffer,
          };
        }

        const taggedBuffer = NodeID3.update(tags, fileBuffer);
        if (taggedBuffer) {
          fileBuffer = Buffer.from(taggedBuffer);
        }
      } catch (e) {
        console.error('ID3 embed error:', e);
      }
    }

    // Build filename
    const ext = isVideoDownload ? (targetUrl.includes('.webm') ? '.webm' : '.mp4') : (isMP3 ? '.mp3' : targetUrl.includes('.wav') ? '.wav' : targetUrl.includes('.ogg') ? '.ogg' : '.mp3');
    const baseName = isVideoDownload ? `[Jalaloaded.com] ${song.artist} - ${song.title} (Official Music Video)` : `[Jalaloaded.com] ${song.artist} - ${song.title}`;
    const safeName = baseName.replace(/[^a-zA-Z0-9\s\-_.[\]()]/g, '').trim();
    const filename = `${safeName}${ext}`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
