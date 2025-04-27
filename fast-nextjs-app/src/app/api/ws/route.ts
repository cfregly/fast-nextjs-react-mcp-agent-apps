import { WebSocketServer, WebSocket } from 'ws';
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface WebSocketMessage {
  type: string;
  data?: any;
}

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', async (message: Buffer) => {
    try {
      const data: WebSocketMessage = JSON.parse(message.toString());
      
      if (data.type === 'subscribe') {
        // Subscribe to itinerary updates
        const itineraries = await kv.get('itineraries');
        ws.send(JSON.stringify({ type: 'initial', data: itineraries }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

export async function GET(req: Request) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new NextResponse('Expected WebSocket', { status: 400 });
  }

  const { socket: ws, response } = await new Promise<{ socket: WebSocket; response: NextResponse }>((resolve) => {
    wss.handleUpgrade(req, (req as any).socket, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws);
      resolve({ socket: ws, response: new NextResponse(null, { status: 101 }) });
    });
  });

  return response;
} 