import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Test OpenSign API endpoint',
    status: 'ok' 
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Test OpenSign API endpoint',
    method: 'POST',
    status: 'ok' 
  });
}