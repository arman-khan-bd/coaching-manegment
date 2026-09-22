package com.coachflow.gateway.sms

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import java.net.Inet4Address
import java.net.NetworkInterface

class SmsGatewayModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "SmsGatewayModule"
    private var httpServer: LocalHttpServer? = null

    override fun getName(): String {
        return "SmsGatewayModule"
    }

    /**
     * Finds SIM 1 (First active SIM subscription slot 0)
     */
    private fun getSim1SubscriptionInfo(): SubscriptionInfo? {
        if (ContextCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.READ_PHONE_STATE
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return null
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val subscriptionManager =
                reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            val activeList = subscriptionManager?.activeSubscriptionInfoList
            if (!activeList.isNullOrEmpty()) {
                // Sort by simSlotIndex ascending to guarantee Slot 0 (SIM 1) comes first
                return activeList.minByOrNull { it.simSlotIndex } ?: activeList.first()
            }
        }
        return null
    }

    /**
     * Send SMS specifically via SIM 1
     */
    @ReactMethod
    fun sendSms(phoneNumber: String, message: String, promise: Promise) {
        try {
            if (ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.SEND_SMS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "SEND_SMS permission is not granted.")
                return
            }

            val sim1Info = getSim1SubscriptionInfo()
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1 && sim1Info != null) {
                Log.d(TAG, "Routing SMS via SIM 1 (SubId: ${sim1Info.subscriptionId}, Slot: ${sim1Info.simSlotIndex}, Carrier: ${sim1Info.carrierName})")
                SmsManager.getSmsManagerForSubscriptionId(sim1Info.subscriptionId)
            } else {
                Log.d(TAG, "Routing SMS via Default SmsManager")
                SmsManager.getDefault()
            }

            val parts = smsManager.divideMessage(message)
            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)

            val map = Arguments.createMap().apply {
                putBoolean("success", true)
                putInt("parts", parts.size)
                putInt("simSlot", 1)
                putString("carrier", sim1Info?.carrierName?.toString() ?: "Default SIM")
                putString("messageId", "msg_${System.currentTimeMillis()}")
                putString("timestamp", java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date()))
            }
            promise.resolve(map)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS via SIM 1", e)
            promise.reject("SEND_FAILED", e.message, e)
        }
    }

    /**
     * Directly send SMS (used by embedded HTTP server thread)
     */
    fun sendDirectSms(phoneNumber: String, message: String): Boolean {
        return try {
            val sim1Info = getSim1SubscriptionInfo()
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1 && sim1Info != null) {
                SmsManager.getSmsManagerForSubscriptionId(sim1Info.subscriptionId)
            } else {
                SmsManager.getDefault()
            }
            val parts = smsManager.divideMessage(message)
            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Direct send SMS failed", e)
            false
        }
    }

    /**
     * Get details of all SIM cards currently active on the phone
     */
    @ReactMethod
    fun getSimCards(promise: Promise) {
        val array = Arguments.createArray()
        try {
            if (ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.READ_PHONE_STATE
                ) == PackageManager.PERMISSION_GRANTED && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1
            ) {
                val subscriptionManager =
                    reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                val list = subscriptionManager?.activeSubscriptionInfoList
                if (list != null) {
                    val sortedList = list.sortedBy { it.simSlotIndex }
                    for ((index, info) in sortedList.withIndex()) {
                        val map = Arguments.createMap().apply {
                            putInt("slotIndex", info.simSlotIndex)
                            putString("carrierName", info.carrierName?.toString() ?: "SIM ${info.simSlotIndex + 1}")
                            putString("displayName", info.displayName?.toString() ?: "SIM ${info.simSlotIndex + 1}")
                            putInt("subscriptionId", info.subscriptionId)
                            putBoolean("isFirstSim", index == 0 || info.simSlotIndex == 0)
                        }
                        array.pushMap(map)
                    }
                }
            } else {
                // Fallback for older devices
                val telephonyManager = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
                val map = Arguments.createMap().apply {
                    putInt("slotIndex", 0)
                    putString("carrierName", telephonyManager?.networkOperatorName ?: "Primary Carrier")
                    putString("displayName", "SIM 1")
                    putInt("subscriptionId", 1)
                    putBoolean("isFirstSim", true)
                }
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("SIM_ERROR", e.message, e)
        }
    }

    /**
     * Get battery level and charging status
     */
    @ReactMethod
    fun getBatteryStatus(promise: Promise) {
        try {
            val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus = reactContext.registerReceiver(null, filter)

            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL

            val batteryPct = if (level >= 0 && scale > 0) (level * 100 / scale) else 100

            val map = Arguments.createMap().apply {
                putInt("level", batteryPct)
                putBoolean("isCharging", isCharging)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message, e)
        }
    }

    /**
     * Start local embedded HTTP server
     */
    @ReactMethod
    fun startLocalHttpServer(port: Int, apiKey: String, promise: Promise) {
        try {
            if (httpServer == null) {
                httpServer = LocalHttpServer(reactContext, port, apiKey) { to, message ->
                    sendDirectSms(to, message)
                }
                httpServer?.start()
            }

            val localIp = getDeviceIpAddress()
            val map = Arguments.createMap().apply {
                putBoolean("success", true)
                putInt("port", port)
                putString("ipAddress", localIp)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("SERVER_ERROR", e.message, e)
        }
    }

    /**
     * Stop local embedded HTTP server
     */
    @ReactMethod
    fun stopLocalHttpServer(promise: Promise) {
        try {
            httpServer?.stop()
            httpServer = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SERVER_ERROR", e.message, e)
        }
    }

    private fun getDeviceIpAddress(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val iface = interfaces.nextElement()
                val addresses = iface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        return addr.hostAddress ?: "127.0.0.1"
                    }
                }
            }
        } catch (_: Exception) {}
        return "127.0.0.1"
    }
}
