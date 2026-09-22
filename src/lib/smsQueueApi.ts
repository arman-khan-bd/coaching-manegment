import { supabase } from './supabase';
import type { SmsQueueItem } from './types';

// In-memory queue store for fast local/offline fallback
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

  // 1. Save to local storage
  const localList = getLocalQueue();
  saveLocalQueue([item, ...localList]);

  // 2. Sync to Supabase `sms_queue` table
  try {
    const { error } = await supabase.from('sms_queue').insert({
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

  // 3. Post to dev server REST API if available
  if (typeof window !== 'undefined') {
    fetch(`/api/sms/${encodeURIComponent(coachingCenterId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        to: item.recipientPhone,
        recipientName: item.recipientName,
        message: item.message,
      }),
    }).catch(() => {
      // Dev server may not be active or remote
    });
  }

  return { success: true, item };
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
  // Try HTTP REST endpoint first
  if (baseUrl || typeof window !== 'undefined') {
    const targetUrl = `${baseUrl}/api/sms/${encodeURIComponent(coachingCenterId)}`;
    try {
      const resp = await fetch(targetUrl, {
        headers: { Accept: 'application/json' },
      });
      if (resp.ok) {
        const json = await resp.json();
        return json;
      }
    } catch (err) {
      // Fallback to Supabase below
    }
  }

  // Fallback: Query Supabase directly
  try {
    const { data, error } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('coaching_center_id', coachingCenterId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

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

  // Local storage fallback for local testing
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
  const targetUrl = `${baseUrl}/api/sms/${encodeURIComponent(coachingCenterId)}/status`;
  try {
    await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: smsId,
        status,
        simSlot,
        errorMessage,
      }),
    });
  } catch (e) {
    // Ignore, will also update Supabase
  }

  // 3. Update Supabase
  try {
    await supabase
      .from('sms_queue')
      .update({
        status,
        sim_slot: simSlot,
        error_message: errorMessage,
        sent_at: now,
      })
      .eq('id', smsId);
  } catch (e) {
    // ignore
  }

  return true;
}
