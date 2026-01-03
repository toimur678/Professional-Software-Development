import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check backend connectivity
    let backendStatus = 'unknown';
    let backendLatency = 0;
    
    try {
      const startTime = Date.now();
      const backendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/health`,
        { next: { revalidate: 0 } }
      );
      backendLatency = Date.now() - startTime;
      backendStatus = backendResponse.ok ? 'healthy' : 'unhealthy';
    } catch {
      backendStatus = 'unreachable';
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
      environment: process.env.NODE_ENV,
      services: {
        backend: {
          status: backendStatus,
          latency_ms: backendLatency
        }
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
