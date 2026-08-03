import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('jalaloaded2026indexnowkey', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
