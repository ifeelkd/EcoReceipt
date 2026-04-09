import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const APPLICATIONS_KEY = 'pending_applications';
const ARCHIVE_KEY = 'completed_applications';

// Initialize Redis Client
const client = createClient({
  url: process.env.KV_REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function getRedis() {
  if (!client.isOpen) await client.connect();
  return client;
}

export async function GET(request: Request) {
  if (!process.env.KV_REDIS_URL) {
    return NextResponse.json({ error: 'KV_REDIS_URL not configured in .env.local' }, { status: 503 });
  }
  
  const { searchParams } = new URL(request.url);
  const history = searchParams.get('history') === 'true';
  const key = history ? ARCHIVE_KEY : APPLICATIONS_KEY;
  
  try {
    const redis = await getRedis();
    const data = await redis.get(key);
    const applications = data ? JSON.parse(data) : [];
    return NextResponse.json(applications);
  } catch (error) {
    console.error(`Redis GET Error (${key}):`, error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.KV_REDIS_URL) {
    return NextResponse.json({ error: 'KV_REDIS_URL not configured in .env.local' }, { status: 503 });
  }

  try {
    const newApp = await request.json();
    
    if (!newApp.walletAddress || !newApp.businessName || !newApp.email || !newApp.industry || !newApp.taxId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const redis = await getRedis();
    const data = await redis.get(APPLICATIONS_KEY);
    const currentApps: any[] = data ? JSON.parse(data) : [];
    
    // Check for duplicates
    const exists = currentApps.some(app => app.walletAddress.toLowerCase() === newApp.walletAddress.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Application already exists' }, { status: 409 });
    }

    const updatedApps = [...currentApps, { 
      ...newApp, 
      id: newApp.walletAddress, 
      timestamp: Date.now() 
    }];
    await redis.set(APPLICATIONS_KEY, JSON.stringify(updatedApps));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis POST Error:', error);
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!process.env.KV_REDIS_URL) {
    return NextResponse.json({ error: 'KV_REDIS_URL not configured in .env.local' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const redis = await getRedis();
    const data = await redis.get(APPLICATIONS_KEY);
    const currentApps: any[] = data ? JSON.parse(data) : [];
    
    const appToArchive = currentApps.find(app => app.walletAddress.toLowerCase() === address.toLowerCase());
    const updatedApps = currentApps.filter(app => app.walletAddress.toLowerCase() !== address.toLowerCase());
    
    // 1. Remove from pending
    await redis.set(APPLICATIONS_KEY, JSON.stringify(updatedApps));
    
    // 2. Add to archive if it existed
    if (appToArchive) {
      const archiveData = await redis.get(ARCHIVE_KEY);
      const currentArchive: any[] = archiveData ? JSON.parse(archiveData) : [];
      
      // Avoid duplicates in archive
      if (!currentArchive.some(app => app.walletAddress.toLowerCase() === address.toLowerCase())) {
        const updatedArchive = [...currentArchive, { ...appToArchive, completedAt: Date.now() }];
        await redis.set(ARCHIVE_KEY, JSON.stringify(updatedArchive));
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
