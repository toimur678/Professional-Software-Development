import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for analytics events (in production, use a proper backend/database)
const analyticsEvents: any[] = [];
const MAX_EVENTS = 10000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events format' },
        { status: 400 }
      );
    }

    // Add server timestamp and IP
    const enrichedEvents = events.map((event: any) => ({
      ...event,
      serverTimestamp: Date.now(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    }));

    // Store events (in production, send to analytics service like PostHog, Mixpanel, etc.)
    analyticsEvents.push(...enrichedEvents);
    
    // Keep only last MAX_EVENTS
    if (analyticsEvents.length > MAX_EVENTS) {
      analyticsEvents.splice(0, analyticsEvents.length - MAX_EVENTS);
    }

    // In production, forward to external analytics service
    // await forwardToAnalyticsService(enrichedEvents);

    return NextResponse.json({ 
      success: true, 
      eventsReceived: events.length 
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return basic analytics stats (for internal use only)
  return NextResponse.json({
    totalEvents: analyticsEvents.length,
    recentEvents: analyticsEvents.slice(-10),
  });
}
