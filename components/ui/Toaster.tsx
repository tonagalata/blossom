'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#FFFFFF',
          border: '1px solid #D0C8BE',
          color: '#1C1A18',
          fontSize: '0.8125rem',
        },
      }}
    />
  )
}

export { toast } from 'sonner'
