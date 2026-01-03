import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for errors (in production, use Sentry or similar)
const errorEvents: any[] = [];
const MAX_ERRORS = 1000;

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();

    // Enrich with server-side data
    const enrichedError = {
      ...errorData,
      serverTimestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    };

    // Store error (in production, send to error tracking service)
    errorEvents.push(enrichedError);
    
    // Keep only last MAX_ERRORS
    if (errorEvents.length > MAX_ERRORS) {
      errorEvents.splice(0, errorEvents.length - MAX_ERRORS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error reported:', enrichedError);
    }

    // In production, forward to error tracking service
    // await forwardToSentry(enrichedError);

    return NextResponse.json({ 
      success: true, 
      errorId: enrichedError.fingerprint?.[0] || Date.now().toString()
    });
  } catch (error) {
    console.error('Error API error:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return recent errors (for internal use only - protect this in production)
  return NextResponse.json({
    totalErrors: errorEvents.length,
    recentErrors: errorEvents.slice(-20).map(e => ({
      name: e.name,
      message: e.message,
      level: e.level,
      timestamp: e.serverTimestamp,
    })),
  });
}
