# 📱 CoachFlow Android SMS Gateway & Companion Admin App

Production-ready React Native Android companion app for [CoachFlow SaaS](https://coaching-bd.netlify.app/).

This app serves two primary functions:
1. **Full-Featured Admin Dashboard Viewer**: Seamlessly displays the CoachFlow web management dashboard (`https://coaching-bd.netlify.app/`) inside a responsive, native-like WebView with pull-to-refresh and offline support.
2. **Native Dual-SIM SMS Gateway (SIM 1 Priority)**: Turns any local Android phone with a Bangladeshi SIM card (Grameenphone, Banglalink, Robi, Teletalk) into an automated ৳0.00-markup SMS gateway for attendance, exam results, and fee alerts.

---

## ⚡ Key Features

- **🌐 Integrated Web Dashboard**: Loads `https://coaching-bd.netlify.app/` with full navigation controls, progress indicator, and bidirectional JavaScript bridge.
- **📶 Dual-SIM Intelligent Routing**:
  - Automatically queries Android's `SubscriptionManager` for all installed SIM cards.
  - **Always selects SIM 1 (Slot 0)** for all outbound messages, preserving SIM 2 for personal usage.
- **🇧🇩 Bangla Unicode & Multi-part SMS**:
  - Splits long Bengali notifications into standard multi-part SMS (`sendMultipartTextMessage`) to ensure zero character corruption.
- **⚡ Embedded REST API Server (`http://<phone-ip>:8080`)**:
  - Exposes `POST /api/sms/send` and `GET /api/sms/status` endpoints on the local Wi-Fi network.
  - Authenticated via gateway API key (`gw_apk_live_gp_9f82d02c81e9bca23`).
- **🔄 Zero-Latency JS Bridge**:
  - When you use the web dashboard inside this app, sending SMS automatically dispatches straight through the native SIM 1 sender without external server roundtrips.
- **🔋 Live Node Monitoring**:
  - Displays battery percentage, SIM 1 carrier name, daily safety quota counter, and live transmission logs.
- **🛡️ 24/7 Foreground Service**:
  - Runs a persistent notification service (`GatewayForegroundService`) to prevent Android OS battery optimization from killing the gateway in the background.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Android Studio with Android SDK 34 (Android 14) and Android NDK
- An Android device with a SIM card in **SIM Slot 1**

### Installation

```bash
cd coachflow-android-gateway
npm install
```

### Running in Development Mode

1. Connect your Android phone via USB and enable **USB Debugging** in Developer Options.
2. Verify device connection:
   ```bash
   adb devices
   ```
3. Start the Metro bundler:
   ```bash
   npm start
   ```
4. In another terminal, run on Android:
   ```bash
   npm run android
   ```

### Building the Release APK

To create a standalone installable `.apk` file for your coaching center phones:

```bash
cd android
./gradlew assembleRelease
```
The resulting APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 📡 REST API Documentation

The Android phone hosts a local REST API on port `8080`.

### 1. Check Gateway Status
- **Endpoint**: `GET http://<phone-ip>:8080/api/sms/status`
- **Response**:
```json
{
  "connected": true,
  "device": "CoachFlow Android SMS Gateway",
  "simSlot": 1,
  "serverPort": 8080,
  "status": "online"
}
```

### 2. Send SMS via SIM 1
- **Endpoint**: `POST http://<phone-ip>:8080/api/sms/send`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer gw_apk_live_gp_9f82d02c81e9bca23`
- **Request Body**:
```json
{
  "to": "+8801711456789",
  "message": "সম্মানিত অভিভাবক, ফারহান শাকিল আজ পদার্থবিজ্ঞান ক্লাসে উপস্থিত ছিল। - এপেক্স কেয়ার"
}
```
- **Response**:
```json
{
  "success": true,
  "simSlot": 1,
  "to": "+8801711456789",
  "messageId": "msg_1727010480000",
  "timestamp": 1727010480000
}
```

### Testing with cURL
```bash
curl -X POST http://192.168.0.105:8080/api/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gw_apk_live_gp_9f82d02c81e9bca23" \
  -d '{"to": "+8801711456789", "message": "টেস্ট বার্তা"}'
```

Or using the included Node.js test script:
```bash
node test-api-client.js 192.168.0.105 +8801711456789
```

---

## 🔒 Dual-SIM Logic Implementation

In `SmsGatewayModule.kt`, the Android `SubscriptionManager` queries active subscriptions:

```kotlin
val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
val activeList = subscriptionManager.activeSubscriptionInfoList

// Sort by simSlotIndex to guarantee Slot 0 (SIM 1)
val sim1 = activeList?.minByOrNull { it.simSlotIndex }

val smsManager = if (sim1 != null) {
    SmsManager.getSmsManagerForSubscriptionId(sim1.subscriptionId)
} else {
    SmsManager.getDefault()
}

smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
```
This guarantees that even when two SIM cards are installed, outgoing coaching messages will **always** be routed through the primary SIM (SIM 1).
