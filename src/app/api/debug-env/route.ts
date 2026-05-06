
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    hasKey: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'none'
  });
}
