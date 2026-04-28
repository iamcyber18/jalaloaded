import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import NodeID3 from 'node-id3';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();

    // Find the song and increment downloads
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

    // If MP3, embed cover art and metadata using ID3 tags
    if (isMP3 && song.coverUrl) {
      try {
        // Fetch cover art
        const coverRes = await fetch(song.coverUrl);
        if (coverRes.ok) {
          const coverBuffer = Buffer.from(await coverRes.arrayBuffer());
          const coverType = coverRes.headers.get('content-type') || 'image/jpeg';

          const tags = {
            title: song.title,
            artist: song.artist,
            album: 'Jalaloaded',
            year: String(song.year || new Date().getFullYear()),
            genre: song.genre,
            comment: { language: 'eng', text: song.description || 'Downloaded from Jalaloaded' },
            image: {
              mime: coverType,
              type: { id: 3, name: 'front cover' },
              description: 'Cover',
              imageBuffer: coverBuffer,
            },
          };

          const taggedBuffer = NodeID3.update(tags, audioBuffer);
          if (taggedBuffer) {
            audioBuffer = Buffer.from(taggedBuffer);
          }
        }
      } catch (e) {
        console.error('Cover embed error:', e);
      }
    } else if (isMP3) {
      try {
        const tags = {
          title: song.title,
          artist: song.artist,
          album: 'Jalaloaded',
          year: String(song.year || new Date().getFullYear()),
          genre: song.genre,
        };
        const taggedBuffer = NodeID3.update(tags, audioBuffer);
        if (taggedBuffer) {
          audioBuffer = Buffer.from(taggedBuffer);
        }
      } catch (e) {
        console.error('Tag embed error:', e);
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
