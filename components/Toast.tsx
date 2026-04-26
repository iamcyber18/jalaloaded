'use client';

import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster 
      position="bottom-center"
      toastOptions={{
        style: {
          background: '#0D0D0D',
          color: '#fff',
          fontSize: '12px',
          border: '0.5px solid rgba(255,107,0,0.4)',
          fontFamily: '"DM Sans", sans-serif',
          borderRadius: '8px',
        },
      }}
    />
  );
}
