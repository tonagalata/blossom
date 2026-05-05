import { NextRequest, NextResponse } from 'next/server'
import { getUploadedImage } from '@/lib/store'

export async function GET(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const result = await getUploadedImage(filename)
  if (!result) return new NextResponse(null, { status: 404 })

  return new NextResponse(result.data as unknown as BodyInit, {
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
