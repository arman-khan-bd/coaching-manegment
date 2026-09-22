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

/**
 * Enqueue a new SMS request for a specific coaching center
 */
export async function enqueueSmsToQueue(
  coachingCenterId: string,
  recipientPhone: string,
  recipientName: string,
  message: string
): Promise<{ success: boolean; item: SmsQueueItem }> {
  const cleanPhone = recipientPhone.replace(/\s+/g, '');
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

  return { success: true, item };
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
