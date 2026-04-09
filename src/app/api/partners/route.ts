import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const PARTNERS_KEY = 'approved_partners';

// Initialize Redis Client
const client = createClient({
  url: process.env.KV_REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function getRedis() {
  if (!client.isOpen) await client.connect();
  return client;
}

export async function GET() {
  if (!process.env.KV_REDIS_URL) {
    return NextResponse.json({ error: 'KV_REDIS_URL not configured' }, { status: 503 });
  }
  
  try {
    const redis = await getRedis();
    const data = await redis.get(PARTNERS_KEY);
    const partners = data ? JSON.parse(data) : [];
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Redis GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.KV_REDIS_URL) {
    return NextResponse.json({ error: 'KV_REDIS_URL not configured' }, { status: 503 });
  }

  try {
    const newPartner = await request.json();
    
    if (!newPartner.walletAddress || !newPartner.businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const redis = await getRedis();
    const data = await redis.get(PARTNERS_KEY);
    const currentPartners: any[] = data ? JSON.parse(data) : [];
    
    // Check for duplicates
    const exists = currentPartners.some(p => p.walletAddress.toLowerCase() === newPartner.walletAddress.toLowerCase());
    if (exists) {
      // Just update it
      const updatedPartners = currentPartners.map(p => 
        p.walletAddress.toLowerCase() === newPartner.walletAddress.toLowerCase() ? { ...p, ...newPartner, approvedAt: Date.now() } : p
      );
      await redis.set(PARTNERS_KEY, JSON.stringify(updatedPartners));
    } else {
      const updatedPartners = [...currentPartners, { ...newPartner, approvedAt: Date.now() }];
      await redis.set(PARTNERS_KEY, JSON.stringify(updatedPartners));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis POST Error:', error);
    return NextResponse.json({ error: 'Failed to save partner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!process.env.KV_REDIS_URL) {
    return NextResponse.json({ error: 'KV_REDIS_URL not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const redis = await getRedis();
    const data = await redis.get(PARTNERS_KEY);
    const currentPartners: any[] = data ? JSON.parse(data) : [];
    const updatedPartners = currentPartners.filter(p => p.walletAddress.toLowerCase() !== address.toLowerCase());
    
    await redis.set(PARTNERS_KEY, JSON.stringify(updatedPartners));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
  }
}
