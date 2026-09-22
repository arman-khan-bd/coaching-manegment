import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qmrpvrsysbbmjxjdrzaj.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ibH84sYVdp6hleVaGN_i4g_6PQX3ajJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
  'Content-Type': 'application/json',
};

const BENGALI_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

function normalizePhoneNumber(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  str = str.replace(/[০-৯]/g, (d) => BENGALI_DIGITS[d] || d);
  const hasPlus = str.startsWith('+');
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 11 && /^01[3-9]\d{8}$/.test(digits)) {
    return '+88' + digits;
  }
  if (digits.length === 13 && /^8801[3-9]\d{8}$/.test(digits)) {
    return '+' + digits;
  }
  if (digits.length === 10 && /^1[3-9]\d{8}$/.test(digits)) {
    return '+880' + digits;
  }
  if (hasPlus && digits.length >= 7) {
    return '+' + digits;
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return '+88' + digits;
  }
  if (digits.length >= 11 && digits.startsWith('880')) {
    return '+' + digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return '+88' + digits;
  }
  return hasPlus ? '+' + digits : digits;
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Parse URL path
    const rawPath = event.path || '';
    const cleanPath = rawPath.replace(/^\/\.netlify\/functions\/sms/, '').replace(/^\/api\/sms/, '');
    const segments = cleanPath.split('/').filter(Boolean);

    // segments[0] = coachingCenterId (e.g. 'aac-dhaka-01')
    // segments[1] = subAction (e.g. 'status', 'cancel')
    const coachingCenterId = segments[0] ? decodeURIComponent(segments[0]) : 'aac-dhaka-01';
    const subAction = segments[1] || '';

    // 1. UPDATE STATUS (POST /api/sms/:coachingCenterId/status)
    if (event.httpMethod === 'POST' && subAction === 'status') {
      const data = JSON.parse(event.body || '{}');
      if (!data.id) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'SMS id is required' }),
        };
      }

      const status = data.status || 'sent';
      const simSlot = data.simSlot || 1;
      const errorMessage = data.errorMessage || null;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('sms_queue')
        .update({
          status,
          sim_slot: simSlot,
          error_message: errorMessage,
          sent_at: status === 'sent' ? now : null,
        })
        .eq('id', data.id);

      if (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, id: data.id, status }),
      };
    }

    // 2. CANCEL SMS (POST /api/sms/:coachingCenterId/cancel OR DELETE /api/sms/:coachingCenterId)
    if (subAction === 'cancel' || event.httpMethod === 'DELETE') {
      let smsId = '';
      if (event.body) {
        try {
          const bodyData = JSON.parse(event.body);
          smsId = bodyData.id || '';
        } catch (_) {}
      }
      if (!smsId && event.queryStringParameters) {
        smsId = event.queryStringParameters.id || '';
      }

      if (!smsId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing sms id to cancel' }),
        };
      }

      const { error } = await supabase
        .from('sms_queue')
        .update({
          status: 'cancelled',
          error_message: 'Cancelled from website dashboard',
        })
        .eq('id', smsId);

      if (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, id: smsId, status: 'cancelled' }),
      };
    }

    // 3. ENQUEUE SMS (POST /api/sms/:coachingCenterId)
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      const rawPhone = data.to || data.recipient_phone || data.recipientPhone || '';
      const recipientPhone = normalizePhoneNumber(rawPhone);
      const message = data.message || '';

      if (!recipientPhone || !message) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'recipient phone and message are required' }),
        };
      }

      const id = data.id || `sms-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const recipientName = data.recipientName || data.recipient_name || 'প্রাপক';
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('sms_queue')
        .upsert({
          id,
          coaching_center_id: coachingCenterId,
          recipient_phone: recipientPhone,
          recipient_name: recipientName,
          message,
          status: 'pending',
          sim_slot: 1,
          created_at: now,
        });

      if (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          messageId: id,
          coaching_center_id: coachingCenterId,
          status: 'pending',
          message: 'SMS successfully enqueued for Android Gateway polling',
        }),
      };
    }

    // 4. GET PENDING SMS (GET /api/sms/:coachingCenterId)
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('sms_queue')
        .select('*')
        .eq('coaching_center_id', coachingCenterId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message }),
        };
      }

      const messages = (data || []).map((row) => ({
        id: row.id,
        to: row.recipient_phone,
        recipientName: row.recipient_name || '',
        message: row.message,
        coachingCenterId: row.coaching_center_id,
        createdAt: row.created_at,
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          coaching_center_id: coachingCenterId,
          count: messages.length,
          messages,
          serverTime: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
