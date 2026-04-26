'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { timeAgo } from '@/lib/utils';
import Image from 'next/image';

interface CommentType {
  _id: string;
  name: string;
  body: string;
  likes: number;
  createdAt: string;
  replies?: CommentType[];
}

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      toast.error('Name and comment are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId: parentId || undefined,
          name,
          body,
        }),
      });

      if (res.ok) {
        toast.success('Comment posted successfully');
        setName('');
        setBody('');
        setReplyingTo(null);
        await fetchComments();
      } else {
         toast.error('Failed to post comment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentCard = ({ comment, isReply = false }: { comment: CommentType, isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-4' : 'mt-6'}`}>
       <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center font-syne font-bold text-[#FF6B00]">
          {comment.name.charAt(0).toUpperCase()}
       </div>
       <div className="flex-1">
          <div className="bg-white rounded-xl p-4 border border-black/5">
             <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[13px]">{comment.name}</span>
                <span className="text-[10px] text-black/40">{timeAgo(comment.createdAt)}</span>
             </div>
             <p className="text-[13px] text-black/70 leading-relaxed font-lora">
                {comment.body}
             </p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 px-2 text-[11px] font-medium text-black/50">
             <button className="hover:text-[#FF6B00] transition-colors flex items-center gap-1">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
               {comment.likes || 0}
             </button>
             {!isReply && (
               <button 
                 onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                 className="hover:text-[#FF6B00] transition-colors"
               >
                 Reply
               </button>
             )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment._id && (
            <form onSubmit={(e) => handleSubmit(e, comment._id)} className="mt-4 flex flex-col gap-3">
               <input 
                 type="text" 
                 placeholder="Your Name" 
                 value={name} onChange={(e) => setName(e.target.value)}
                 className="bg-white border border-black/10 rounded px-3 py-2 text-[13px] outline-none focus:border-[#FF6B00]" 
                 required 
               />
               <textarea 
                 placeholder="Write a reply..." 
                 value={body} onChange={(e) => setBody(e.target.value)}
                 rows={2}
                 className="bg-white border border-black/10 rounded px-3 py-2 text-[13px] outline-none focus:border-[#FF6B00] resize-none" 
                 required 
               />
               <div className="flex gap-2">
                 <button type="submit" disabled={isSubmitting} className="bg-[#FF6B00] text-white px-4 py-1.5 rounded text-[12px] font-bold hover:bg-[#e05e00]">
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                 </button>
                 <button type="button" onClick={() => setReplyingTo(null)} className="bg-neutral-200 text-black px-4 py-1.5 rounded text-[12px] font-bold hover:bg-neutral-300">
                    Cancel
                 </button>
               </div>
            </form>
          )}

          {/* Render Replies */}
          {comment.replies?.map(reply => (
             <CommentCard key={reply._id} comment={reply} isReply={true} />
          ))}
       </div>
    </div>
  );

  return (
    <div className="mt-12 pt-8 border-t border-black/10">
      <h3 className="font-syne font-bold text-xl mb-6">Leave a Comment</h3>
      
      <form onSubmit={(e) => handleSubmit(e)} className="bg-white rounded-xl p-5 border border-black/5 shadow-sm mb-10">
         <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Your Name *" 
              value={name} onChange={(e) => setName(e.target.value)}
              className="bg-neutral-50 border border-black/5 rounded w-full md:w-1/2 px-4 py-3 text-[14px] outline-none focus:border-[#FF6B00] transition-colors" 
              required 
            />
            <textarea 
              placeholder="Join the discussion..." 
              value={body} onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="bg-neutral-50 border border-black/5 rounded w-full px-4 py-3 text-[14px] outline-none focus:border-[#FF6B00] transition-colors resize-y" 
              required 
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#0D0D0D] text-white px-6 py-3 rounded font-bold text-[13px] tracking-wide hover:bg-[#FF6B00] transition-colors w-max self-end disabled:opacity-50"
            >
              {isSubmitting ? 'POSTING...' : 'POST COMMENT'}
            </button>
         </div>
      </form>

      <div className="mb-8">
         <h3 className="font-syne font-bold text-lg mb-2">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} Comments</h3>
         
         {loading ? (
            <div className="py-8 text-center text-black/50 text-sm animate-pulse">Loading comments...</div>
         ) : comments.length === 0 ? (
            <div className="py-8 text-center text-black/50 text-sm">No comments yet. Be the first to start the gist!</div>
         ) : (
            <div className="flex flex-col">
               {comments.map(c => <CommentCard key={c._id} comment={c} />)}
            </div>
         )}
      </div>
    </div>
  );
}
