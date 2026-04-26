'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IMediaItem } from '@/models/Post';

interface UploaderProps {
  media: IMediaItem[];
  onChange: (media: IMediaItem[]) => void;
}

export default function PostMediaUploader({ media, onChange }: UploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState('');

  const photoCount = media.filter(m => m.type === 'photo').length;
  const videoCount = media.filter(m => m.type === 'video').length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    // Convert FileList to Array
    const files = Array.from(e.target.files);
    
    // Determine types and check limits
    let newPhotos = 0;
    let newVideos = 0;
    
    for (const f of files) {
       if (f.type.startsWith('image/')) newPhotos++;
       else if (f.type.startsWith('video/')) newVideos++;
    }

    if (photoCount + newPhotos > 5) {
       alert("Maximum 5 photos allowed.");
       return;
    }
    if (videoCount + newVideos > 3) {
       alert("Maximum 3 videos allowed.");
       return;
    }

    setIsUploading(true);
    const uploadedMedia: IMediaItem[] = [];
    
    for (const file of files) {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedMedia.push({
             type: type === 'image' ? 'photo' : 'video',
             url: data.url,
             source: 'upload',
             order: media.length + uploadedMedia.length,
             duration: data.duration
          });
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }

    onChange([...media, ...uploadedMedia]);
    setIsUploading(false);
  };

  const handleAddYouTube = () => {
    if (!ytUrl.trim()) return;
    if (videoCount >= 3) {
       alert("Maximum 3 videos allowed.");
       return;
    }
    
    // Rough YT ID extract
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = ytUrl.match(regExp);
    const ytId = (match && match[2].length === 11) ? match[2] : null;

    if (!ytId) {
        alert("Invalid YouTube URL");
        return;
    }

    const newItem: IMediaItem = {
       type: 'video',
       url: ytUrl,
       source: 'youtube',
       thumbnailUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
       order: media.length
    };

    onChange([...media, newItem]);
    setYtUrl('');
  };

  const removeItem = (idx: number) => {
     const newMedia = media.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i }));
     onChange(newMedia);
  };

  // Drag and drop sorting (simplified version for UI)
  const moveItem = (fromIdx: number, toIdx: number) => {
     const items = [...media];
     const [moved] = items.splice(fromIdx, 1);
     items.splice(toIdx, 0, moved);
     onChange(items.map((m, i) => ({ ...m, order: i })));
  };

  return (
    <div className="bg-neutral-50 p-4 rounded-lg border border-black/10">
      <div className="flex items-center justify-between mb-4">
         <h4 className="font-syne font-bold text-[14px]">Media ({media.length}/8 Max)</h4>
         <div className="text-[11px] text-black/50">
           Photos: {photoCount}/5 • Videos: {videoCount}/3
         </div>
      </div>

      {/* Grid of existing media */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
         {media.map((item, idx) => (
            <div 
              key={idx} 
              draggable
              onDragStart={(e) => e.dataTransfer.setData('idx', idx.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                 e.preventDefault();
                 const fromIdx = parseInt(e.dataTransfer.getData('idx'));
                 moveItem(fromIdx, idx);
              }}
              className="relative aspect-video bg-black rounded overflow-hidden group cursor-move border-2 border-transparent hover:border-[#FF6B00]"
            >
               {(item.type === 'photo' || item.thumbnailUrl) ? (
                 <Image src={item.thumbnailUrl || item.url} alt="media" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover opacity-80" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-white text-[10px]">VIDEO</div>
               )}
               
               <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 rounded uppercase">
                  {item.type}
               </div>

               <button 
                 onClick={(e) => { e.preventDefault(); removeItem(idx); }}
                 className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
               >
                 ✕
               </button>
            </div>
         ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
         <div className="relative flex-1 border-2 border-dashed border-black/20 rounded-lg bg-white flex flex-col items-center justify-center p-6 hover:border-[#FF6B00] transition-colors cursor-pointer group">
            <input 
               type="file" 
               multiple 
               accept="image/*,video/mp4" 
               onChange={handleFileUpload}
               disabled={isUploading}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-2xl mb-2">{isUploading ? '⏳' : '📥'}</div>
            <div className="text-[12px] font-bold text-center group-hover:text-[#FF6B00]">
               {isUploading ? 'Uploading...' : 'Click or Drag Files'}
            </div>
         </div>
         
         <div className="flex-1 bg-white border border-black/10 rounded-lg p-3 flex flex-col justify-center">
            <div className="text-[11px] font-bold mb-2">Embed YouTube</div>
            <div className="flex items-center gap-2">
               <input 
                 type="url" 
                 value={ytUrl}
                 onChange={(e) => setYtUrl(e.target.value)}
                 placeholder="https://youtube.com/watch?v=..."
                 className="flex-1 border border-black/10 rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#FF6B00]"
               />
               <button 
                 onClick={(e) => { e.preventDefault(); handleAddYouTube(); }}
                 className="bg-[#0D0D0D] text-white text-[11px] font-bold px-3 py-1.5 rounded hover:bg-[#FF6B00]"
               >
                 Add
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
