import { supabase } from './supabase';
import type { SmsQueueItem } from './types';

// In-memory / local-storage queue store for fast local/offline fallback
const LOCAL_STORAGE_KEY = 'coachflow_sms_queue';

function getLocalQueue(): SmsQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalQueue(items: SmsQueueItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
  } catch (e) {
    // ignore
  }
}

/**
 * Load full SMS queue from Supabase for a coaching center
 */
export async function loadSmsQueueFromSupabase(coachingCenterId: string): Promise<SmsQueueItem[]> {
  try {
    const { data, error } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('coaching_center_id', coachingCenterId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      const items: SmsQueueItem[] = data.map((row: any) => ({
        id: row.id,
        coachingCenterId: row.coaching_center_id,
        recipientPhone: row.recipient_phone,
        recipientName: row.recipient_name || '',
        message: row.message,
        status: (row.status as any) || 'pending',
        simSlot: row.sim_slot || 1,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        sentAt: row.sent_at,
      }));
      // Merge with local storage
      const local = getLocalQueue().filter((l) => l.coachingCenterId !== coachingCenterId);
      saveLocalQueue([...items, ...local]);
      return items;
    }
  } catch (e) {
    console.warn('loadSmsQueueFromSupabase error:', e);
  }
  return getLocalQueue().filter((i) => i.coachingCenterId === coachingCenterId);
}

// Bengali numerals map
const BENGALI_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Universal Phone Normalizer for SMS delivery:
 * - Converts Bengali numerals (০-৯) to English digits (0-9)
 * - Strips spaces, dashes, dots, brackets
 * - Converts Bangladeshi numbers (+8801..., 01..., 8801..., 17...) into standard E.164 (+8801XXXXXXXXX)
 * - Preserves international format (+CountryCode...)
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  let str = String(raw).trim();
  // Replace Bengali digits
  str = str.replace(/[০-৯]/g, (d) => BENGALI_DIGITS[d] || d);
  const hasPlus = str.startsWith('+');
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  // 1. Bangladeshi 11-digit mobile: 013, 014, 015, 016, 017, 018, 019
  if (digits.length === 11 && /^01[3-9]\d{8}$/.test(digits)) {
    return '+88' + digits;
  }
  // 2. Bangladeshi 13-digit mobile with 880
  if (digits.length === 13 && /^8801[3-9]\d{8}$/.test(digits)) {
    return '+' + digits;
  }
  // 3. Bangladeshi 10-digit missing leading 0: 13, 14, 15, 16, 17, 18, 19
  if (digits.length === 10 && /^1[3-9]\d{8}$/.test(digits)) {
    return '+880' + digits;
  }
  // 4. Other international with explicit '+' prefix
  if (hasPlus && digits.length >= 7) {
    return '+' + digits;
  }
  // 5. Fallback 11-digit starting with 01
  if (digits.length === 11 && digits.startsWith('01')) {
    return '+88' + digits;
  }
  // 6. Fallback starting with 880
  if (digits.length >= 11 && digits.startsWith('880')) {
    return '+' + digits;
  }
  // 7. Generic 11-digit starting with 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return '+88' + digits;
  }
  return hasPlus ? '+' + digits : digits;
}

/**
 * Validates if the phone number is a usable mobile number
 */
export function isValidPhoneNumber(raw: string): boolean {
  const norm = normalizePhoneNumber(raw);
  if (/^\+8801[3-9]\d{8}$/.test(norm)) return true;
  if (/^\+[1-9]\d{6,14}$/.test(norm)) return true;
  if (/^01[3-9]\d{8}$/.test(norm)) return true;
  return false;
}

/**
 * Returns mobile network carrier name for BD numbers
 */
export function getBdCarrierName(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (!norm.startsWith('+8801') || norm.length < 7) return '';
  const prefix = norm.substring(4, 6);
  switch (prefix) {
    case '17':
    case '13':
      return 'Grameenphone';
    case '18':
      return 'Robi';
    case '19':
    case '14':
      return 'Banglalink';
    case '15':
      return 'Teletalk';
    case '16':
      return 'Airtel';
    default:
      return 'BD Mobile';
  }
}

/**
 * Formats phone number for clean, user-friendly display (e.g. +880 1701-034883)
 */
export function formatPhoneNumberDisplay(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (/^\+8801[3-9]\d{8}$/.test(norm)) {
    // Format: +880 17XX-XXXXXX
    return `${norm.substring(0, 4)} ${norm.substring(4, 8)}-${norm.substring(8)}`;
  }
  return norm || phone;
}

/**
 * Enqueue a new SMS request for a specific coaching center
 */
export async function enqueueSmsToQueue(
  coachingCenterId: string,
  recipientPhone: string,
  recipientName: string,
  message: string
): Promise<{ success: boolean; item: SmsQueueItem }> {
  const cleanPhone = normalizePhoneNumber(recipientPhone);
  const id = `sms-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const item: SmsQueueItem = {
    id,
    coachingCenterId,
    recipientPhone: cleanPhone,
    recipientName: recipientName || 'প্রাপক',
    message,
    status: 'pending',
    simSlot: 1,
    createdAt: now,
  };

  // 1. Save to local storage for immediate optimistic UI
  const localList = getLocalQueue();
  saveLocalQueue([item, ...localList.filter((x) => x.id !== item.id)]);

  // 2. Sync to Supabase `sms_queue` table
  try {
    const { error } = await supabase.from('sms_queue').upsert({
      id: item.id,
      coaching_center_id: item.coachingCenterId,
      recipient_phone: item.recipientPhone,
      recipient_name: item.recipientName,
      message: item.message,
      status: 'pending',
      sim_slot: 1,
      created_at: now,
    });
    if (error) {
      console.warn('Supabase sms_queue insert notice:', error.message);
    }
  } catch (e) {
    console.warn('Supabase sms_queue catch:', e);
  }

  // 3. Post to REST API (Netlify Function or Vite Dev Server)
  if (typeof window !== 'undefined') {
    fetch(`/api/sms/${encodeURIComponent(coachingCenterId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        id: item.id,
        to: item.recipientPhone,
        recipientName: item.recipientName,
        message: item.message,
      }),
    }).catch(() => {
      // Endpoint may not be active; Supabase handles it directly
    });
  }

  // 4. Instant 0-second Bridge to Flutter Android Companion App (if running inside app)
  if (typeof window !== 'undefined' && (window as any).FlutterGateway) {
    try {
      (window as any).FlutterGateway.postMessage(
        JSON.stringify({
          type: 'REALTIME_SMS_DISPATCH',
          item: {
            id: item.id,
            to: item.recipientPhone,
            recipientName: item.recipientName,
            message: item.message,
            simSlot: item.simSlot,
            coachingCenterId: item.coachingCenterId,
          },
        })
      );
    } catch (_) {}
  }

  return { success: true, item };
}

let activeRealtimeChannel: any = null;

/**
 * Subscribe to Supabase Realtime WebSocket changes on sms_queue
 * Provides instant ~50ms push notifications for new SMS & status updates
 */
export function subscribeToSmsQueueRealtime(
  coachingCenterId: string,
  onQueueUpdated?: (item: SmsQueueItem, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  if (typeof window === 'undefined') return () => {};

  if (activeRealtimeChannel) {
    try {
      supabase.removeChannel(activeRealtimeChannel);
    } catch (_) {}
    activeRealtimeChannel = null;
  }

  const channelName = `sms-queue-rt-${coachingCenterId}`;
  activeRealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sms_queue',
        filter: `coaching_center_id=eq.${coachingCenterId}`,
      },
      (payload: any) => {
        const row = payload.new || payload.old;
        if (!row) return;

        const item: SmsQueueItem = {
          id: row.id,
          coachingCenterId: row.coaching_center_id,
          recipientPhone: row.recipient_phone,
          recipientName: row.recipient_name || '',
          message: row.message,
          status: row.status || 'pending',
          simSlot: row.sim_slot || 1,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          sentAt: row.sent_at,
        };

        if (onQueueUpdated) {
          onQueueUpdated(item, payload.eventType);
        }

        // When a pending SMS arrives via Supabase Realtime, immediately dispatch to Flutter companion app!
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && item.status === 'pending') {
          if (typeof window !== 'undefined' && (window as any).FlutterGateway) {
            try {
              (window as any).FlutterGateway.postMessage(
                JSON.stringify({
                  type: 'REALTIME_SMS_DISPATCH',
                  item: {
                    id: item.id,
                    to: item.recipientPhone,
                    recipientName: item.recipientName,
                    message: item.message,
                    simSlot: item.simSlot,
                    coachingCenterId: item.coachingCenterId,
                  },
                })
              );
            } catch (_) {}
          }
        }
      }
    )
    .subscribe((status: string) => {
      console.log(`Supabase Realtime sms_queue connection for ${coachingCenterId}:`, status);
    });

  return () => {
    if (activeRealtimeChannel) {
      try {
        supabase.removeChannel(activeRealtimeChannel);
      } catch (_) {}
      activeRealtimeChannel = null;
    }
  };
}

/**
 * Cancel an individual pending SMS in the queue
 */
export async function cancelSmsInQueue(
  smsId: string,
  coachingCenterId: string
): Promise<boolean> {
  // 1. Update local storage
  const localList = getLocalQueue();
  const updated = localList.map((i) =>
    i.id === smsId ? { ...i, status: 'cancelled' as const, errorMessage: 'ব্যবহারকারী কর্তৃক বাতিলকৃত' } : i
  );
  saveLocalQueue(updated);

  // 2. Notify REST API if available
  if (typeof window !== 'undefined') {
    fetch(`/api/sms/${encodeURIComponent(coachingCenterId)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: smsId }),
    }).catch(() => {});
  }

  // 3. Update Supabase
  try {
    const { error } = await supabase
      .from('sms_queue')
      .update({
        status: 'cancelled',
        error_message: 'ওয়েবসাইট ড্যাশবোর্ড থেকে বাতিল করা হয়েছে',
      })
      .eq('id', smsId);

    if (error) {
      console.warn('Supabase sms_queue cancel error:', error.message);
    }
  } catch (e) {
    console.warn('Supabase sms_queue cancel catch:', e);
  }

  return true;
}

/**
 * Cancel all pending SMS messages for a coaching center
 */
export async function cancelAllPendingSmsInQueue(
  coachingCenterId: string
): Promise<boolean> {
  const localList = getLocalQueue();
  const updated = localList.map((i) =>
    i.coachingCenterId === coachingCenterId && i.status === 'pending'
      ? { ...i, status: 'cancelled' as const, errorMessage: 'একযোগে বাতিলকৃত' }
      : i
  );
  saveLocalQueue(updated);

  try {
    await supabase
      .from('sms_queue')
      .update({
        status: 'cancelled',
        error_message: 'ড্যাশবোর্ড থেকে একযোগে সকল পেন্ডিং বার্তা বাতিল করা হয়েছে',
      })
      .eq('coaching_center_id', coachingCenterId)
      .eq('status', 'pending');
  } catch (e) {
    console.warn('cancelAllPendingSms catch:', e);
  }

  return true;
}

/**
 * Fetch pending SMS requests for a coaching center (called by Android app or pollers)
 */
export async function fetchPendingSmsFromApi(
  coachingCenterId: string,
  baseUrl: string = ''
): Promise<{
  success: boolean;
  count: number;
  messages: Array<{
    id: string;
    to: string;
    recipientName: string;
    message: string;
    coachingCenterId: string;
    createdAt: string;
  }>;
}> {
  // 1. Try HTTP REST endpoint first (with Content-Type checking to ignore SPA HTML fallbacks)
  if (baseUrl || typeof window !== 'undefined') {
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/api/sms/${encodeURIComponent(coachingCenterId)}`;
    try {
      const resp = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
      });
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('application/json')) {
        const json = await resp.json();
        if (json && Array.isArray(json.messages)) {
          return json;
        }
      }
    } catch (err) {
      // Fallback to Supabase below
    }
  }

  // 2. Direct Supabase Query Fallback
  try {
    const { data, error } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('coaching_center_id', coachingCenterId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (!error && data) {
      return {
        success: true,
        count: data.length,
        messages: data.map((row: any) => ({
          id: row.id,
          to: row.recipient_phone,
          recipientName: row.recipient_name || '',
          message: row.message,
          coachingCenterId: row.coaching_center_id,
          createdAt: row.created_at,
        })),
      };
    }
  } catch (e) {
    // ignore
  }

  // 3. Local storage fallback
  const localPending = getLocalQueue().filter(
    (i) => i.coachingCenterId === coachingCenterId && i.status === 'pending'
  );

  return {
    success: true,
    count: localPending.length,
    messages: localPending.map((i) => ({
      id: i.id,
      to: i.recipientPhone,
      recipientName: i.recipientName || '',
      message: i.message,
      coachingCenterId: i.coachingCenterId,
      createdAt: i.createdAt,
    })),
  };
}

/**
 * Mark an SMS as sent or failed
 */
export async function updateSmsStatusInApi(
  smsId: string,
  coachingCenterId: string,
  status: 'sent' | 'failed',
  simSlot: number = 1,
  errorMessage: string = '',
  baseUrl: string = ''
): Promise<boolean> {
  const now = new Date().toISOString();

  // 1. Update local storage
  const localList = getLocalQueue();
  const updated = localList.map((i) =>
    i.id === smsId ? { ...i, status, sentAt: now, simSlot, errorMessage } : i
  );
  saveLocalQueue(updated);

  // 2. Call REST API status endpoint if reachable
  if (baseUrl || typeof window !== 'undefined') {
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/api/sms/${encodeURIComponent(coachingCenterId)}/status`;
    try {
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: smsId,
          status,
          simSlot,
          errorMessage,
        }),
      });
    } catch (e) {
      // Ignore
    }
  }

  // 3. Update Supabase directly
  try {
    await supabase
      .from('sms_queue')
      .update({
        status,
        sim_slot: simSlot,
        error_message: errorMessage || null,
        sent_at: status === 'sent' ? now : null,
      })
      .eq('id', smsId);
  } catch (e) {
    // ignore
  }

  return true;
}
