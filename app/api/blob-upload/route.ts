// app/api/blob-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'edge' // optional, works fine in node too

export async function POST(req: NextRequest) {
  try {
    const pathname = req.nextUrl.searchParams.get('pathname')
    if (!pathname) {
      return NextResponse.json({ error: 'missing pathname' }, { status: 400 })
    }

    // read raw body and content-type
    const contentType = req.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await req.arrayBuffer()

    // IMPORTANT: use your Read-Write token from Vercel (env var)
    const token = process.env.VERCEL_BLOB_RW_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'server misconfigured: no RW token' }, { status: 500 })
    }

    const { url } = await put(pathname.replace(/^\/+/, ''), arrayBuffer, {
      access: 'public',
      contentType,
      token, // explicit token (works in local dev too)
    })

    return NextResponse.json({ ok: true, url })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}