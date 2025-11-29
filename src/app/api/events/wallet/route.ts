import { NextResponse } from 'next/server';
import eventBus from '@/lib/eventBus';

export async function GET(req: Request) {
  // SSE endpoint that streams wallet events for a user
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  // Create a stream
  const stream = new ReadableStream({
    start(controller) {
      // Initial ping
      controller.enqueue(encodeString('event: ping\n' + 'data: {}\n\n'));

      const onEvent = (ev: any) => {
        try {
          // If userId provided, filter
          if (userId && ev.userId && ev.userId !== userId) return;
          controller.enqueue(encodeString(`data: ${JSON.stringify(ev)}\n\n`));
        } catch (e) { /* swallow */ }
      };

      const unsubscribe = eventBus.subscribe('wallet', onEvent);

      // Cleanup
      (controller as any)._unsubscribe = unsubscribe;
    },
    cancel(reason) {
      // No-op
    }
  });

  return new NextResponse(stream, { headers });
}

function encodeString(s: string) {
  return new TextEncoder().encode(s);
}
