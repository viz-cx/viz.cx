import { NextRequest, NextResponse } from 'next/server'
import { destroySession, SESSION_COOKIE } from '@/lib/session'
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) await destroySession(token)
  const res = new NextResponse(null, { status: 204 })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
