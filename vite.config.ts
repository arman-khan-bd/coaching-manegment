import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';

// In-memory queue for Vite dev server
interface QueueItem {
  id: string;
  coachingCenterId: string;
  to: string;
  recipientName: string;
  message: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  simSlot: number;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

const memoryQueue: QueueItem[] = [
  {
    id: 'sms-demo-1',
    coachingCenterId: 'aac-dhaka-01',
    to: '+8801711456789',
    recipientName: 'ফারহান শাকিল',
    message: 'সম্মানিত অভিভাবক, ফারহান শাকিল আজ ফিজিক্স ক্লাসে উপস্থিত হয়েছে। - এপেক্স কেয়ার',
    status: 'sent',
    simSlot: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sentAt: new Date(Date.now() - 3590000).toISOString(),
  },
];

function smsApiPlugin(): Plugin {
  return {
    name: 'vite-sms-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set CORS headers for Android app & external API callers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = req.url || '';
        const match = url.match(/^\/api\/sms\/([^/?#]+)(?:\/(status|send|cancel))?/);

        if (!match) {
          return next();
        }

        const coachingCenterId = decodeURIComponent(match[1]);
        const subAction = match[2]; // 'status' | 'send' | 'cancel' | undefined

        // 0. POST/DELETE /api/sms/:coaching_center_id/cancel (Cancel pending SMS)
        if ((req.method === 'POST' || req.method === 'DELETE') && subAction === 'cancel') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const target = memoryQueue.find((q) => q.id === data.id);
              if (target) {
                target.status = 'failed';
                target.errorMessage = 'Cancelled by user';
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, updated: Boolean(target), status: 'cancelled' }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body', details: err.message }));
            }
          });
          return;
        }

        // 1. POST /api/sms/:coaching_center_id/status (Update sent/failed status from Android)
        if (req.method === 'POST' && subAction === 'status') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const target = memoryQueue.find((q) => q.id === data.id);
              if (target) {
                target.status = data.status || 'sent';
                target.simSlot = data.simSlot || 1;
                target.sentAt = new Date().toISOString();
                if (data.errorMessage) target.errorMessage = data.errorMessage;
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, updated: Boolean(target) }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body', details: err.message }));
            }
          });
          return;
        }

        // 2. POST /api/sms/:coaching_center_id (or /send) (Enqueue new SMS from Web or external API)
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const newItem: QueueItem = {
                id: data.id || `sms-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                coachingCenterId,
                to: (data.to || data.recipient_phone || '').replace(/\s+/g, ''),
                recipientName: data.recipientName || data.recipient_name || 'প্রাপক',
                message: data.message || '',
                status: 'pending',
                simSlot: 1,
                createdAt: new Date().toISOString(),
              };

              // Avoid duplicate if same ID already queued
              const existingIdx = memoryQueue.findIndex((i) => i.id === newItem.id);
              if (existingIdx >= 0) {
                memoryQueue[existingIdx] = newItem;
              } else {
                memoryQueue.unshift(newItem);
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 201;
              res.end(
                JSON.stringify({
                  success: true,
                  messageId: newItem.id,
                  status: 'pending',
                  coaching_center_id: coachingCenterId,
                  message: 'SMS successfully enqueued for Android Gateway polling',
                })
              );
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body', details: err.message }));
            }
          });
          return;
        }

        // 3. GET /api/sms/:coaching_center_id (Android Phone 10-second polling request)
        if (req.method === 'GET') {
          const pending = memoryQueue.filter(
            (q) => q.coachingCenterId === coachingCenterId && q.status === 'pending'
          );

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              success: true,
              coaching_center_id: coachingCenterId,
              count: pending.length,
              messages: pending.map((p) => ({
                id: p.id,
                to: p.to,
                recipientName: p.recipientName,
                message: p.message,
                coachingCenterId: p.coachingCenterId,
                createdAt: p.createdAt,
              })),
              serverTime: new Date().toISOString(),
            })
          );
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), smsApiPlugin()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
