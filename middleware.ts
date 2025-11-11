import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'
import { Database } from './types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  
  // Refresh session - this establishes the session from cookies set by Supabase
  // This is especially important after Supabase redirects from verification
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // If we have a session but are on the homepage, redirect to overview
  // This handles the case where Supabase redirects to the Site URL after verification
  if (session?.user && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/overview/videos', req.url))
  }
  
  return res
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}