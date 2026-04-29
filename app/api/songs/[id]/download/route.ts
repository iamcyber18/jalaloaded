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

    const audioUrl = song.downloadUrl || song.mediaUrl;
    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio file' }, { status: 404 });
    }

    // Fetch the audio file
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }

    let audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';
    const isMP3 = contentType.includes('mpeg') || audioUrl.includes('.mp3');

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
          comment: { language: 'eng', text: song.description || 'Downloaded from Jalaloaded' },
        };

        if (finalCoverBuffer) {
          tags.image = {
            mime: 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            description: 'Cover',
            imageBuffer: finalCoverBuffer,
          };
        }

        const taggedBuffer = NodeID3.update(tags, audioBuffer);
        if (taggedBuffer) {
          audioBuffer = Buffer.from(taggedBuffer);
        }
      } catch (e) {
        console.error('ID3 embed error:', e);
      }
    }

    // Build filename
    const ext = isMP3 ? '.mp3' : audioUrl.includes('.wav') ? '.wav' : audioUrl.includes('.ogg') ? '.ogg' : '.mp3';
    const safeName = `${song.artist} - ${song.title}`.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
    const filename = `${safeName}${ext}`;

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(audioBuffer.length),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
