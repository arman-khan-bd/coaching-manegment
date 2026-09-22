/**
 * CoachFlow Android SMS Gateway API Test Client
 * Run with: node test-api-client.js [PHONE_IP] [PHONE_NUMBER]
 */

const http = require('http');

const PHONE_IP = process.argv[2] || '192.168.0.105'; // Replace with your phone's Wi-Fi IP
const PORT = 8080;
const API_KEY = 'gw_apk_live_gp_9f82d02c81e9bca23';
const RECIPIENT = process.argv[3] || '+8801711456789';
const MESSAGE = 'সম্মানিত অভিভাবক, CoachFlow Android SMS Gateway SIM 1 API থেকে সফল টেস্ট মেসেজ।';

console.log(`📡 Connecting to CoachFlow Android SMS Gateway at http://${PHONE_IP}:${PORT}...`);

// 1. Check Gateway Status
const statusReq = http.request(
  {
    hostname: PHONE_IP,
    port: PORT,
    path: '/api/sms/status',
    method: 'GET',
    timeout: 3000,
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('✅ Gateway Status Response:', data);
      sendTestSms();
    });
  }
);

statusReq.on('error', (err) => {
  console.error('❌ Could not reach Android Gateway:', err.message);
  console.log('👉 Make sure the CoachFlow Android App is open and phone is on the same Wi-Fi network.');
});
statusReq.end();

// 2. Send SMS via SIM 1
function sendTestSms() {
  const payload = JSON.stringify({
    to: RECIPIENT,
    message: MESSAGE,
    apiKey: API_KEY,
  });

  const sendReq = http.request(
    {
      hostname: PHONE_IP,
      port: PORT,
      path: '/api/sms/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log('🚀 Send SMS Response (via SIM 1):', data);
      });
    }
  );

  sendReq.on('error', (err) => {
    console.error('❌ Failed to send SMS:', err.message);
  });

  sendReq.write(payload);
  sendReq.end();
}
