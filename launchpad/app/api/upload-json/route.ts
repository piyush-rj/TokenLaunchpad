import { NextRequest, NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export async function POST(request: NextRequest) {
    try {
        const metadata = await request.json();

        const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key: PINATA_API_KEY!,
                pinata_secret_api_key: PINATA_SECRET_KEY!,
            },
            body: JSON.stringify(metadata),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        return NextResponse.json({
            url: `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`
        });
    } catch (error) {
        console.error('JSON upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}