import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const APPLICATIONS_KEY = 'pending_applications';

export async function GET() {
  try {
    const applications = await kv.get(APPLICATIONS_KEY) || [];
    return NextResponse.json(applications);
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newApp = await request.json();
    
    // Validations
    if (!newApp.walletAddress || !newApp.businessName || !newApp.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const currentApps: any[] = await kv.get(APPLICATIONS_KEY) || [];
    
    // Prevent duplicates
    const exists = currentApps.some(app => app.walletAddress.toLowerCase() === newApp.walletAddress.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Application already exists' }, { status: 409 });
    }

    const updatedApps = [...currentApps, { ...newApp, id: newApp.walletAddress, timestamp: Date.now() }];
    await kv.set(APPLICATIONS_KEY, updatedApps);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const currentApps: any[] = await kv.get(APPLICATIONS_KEY) || [];
    const updatedApps = currentApps.filter(app => app.walletAddress.toLowerCase() !== address.toLowerCase());
    
    await kv.set(APPLICATIONS_KEY, updatedApps);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
