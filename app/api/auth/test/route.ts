import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Auth API route is working',
    timestamp: new Date().toISOString()
  })
}
