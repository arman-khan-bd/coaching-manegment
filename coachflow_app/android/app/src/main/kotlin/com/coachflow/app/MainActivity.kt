package com.coachflow.app

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.coachflow.app/sms_gateway"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "sendSms" -> {
                    val to = call.argument<String>("to") ?: ""
                    val message = call.argument<String>("message") ?: ""
                    val slot = call.argument<Int>("simSlot") ?: 1

                    if (to.isBlank() || message.isBlank()) {
                        result.error("INVALID_ARGS", "Phone number and message cannot be empty", null)
                        return@setMethodCallHandler
                    }

                    try {
                        val carrier = sendNativeSms(to, message, slot)
                        result.success(mapOf(
                            "success" to true,
                            "simSlot" to slot,
                            "carrier" to carrier
                        ))
                    } catch (e: Exception) {
                        result.error("SEND_FAILED", e.message ?: "Failed to send SMS", null)
                    }
                }

                "getSimCards" -> {
                    try {
                        val sims = getDetectedSimCards()
                        result.success(sims)
                    } catch (e: Exception) {
                        result.success(emptyList<Map<String, Any>>())
                    }
                }

                "getBatteryStatus" -> {
                    try {
                        val battery = getBatteryLevelAndCharging()
                        result.success(battery)
                    } catch (e: Exception) {
                        result.success(mapOf("level" to 85, "isCharging" to false))
                    }
                }

                else -> result.notImplemented()
            }
        }
    }

    private fun sendNativeSms(to: String, message: String, simSlot: Int): String {
        var carrierName = "Primary SIM"

        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val subManager = getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            var selectedSubId = -1

            if (subManager != null && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                val activeSubs: List<SubscriptionInfo>? = subManager.activeSubscriptionInfoList
                if (!activeSubs.isNullOrEmpty()) {
                    val targetSub = activeSubs.firstOrNull { it.simSlotIndex == (simSlot - 1) } ?: activeSubs[0]
                    selectedSubId = targetSub.subscriptionId
                    carrierName = targetSub.displayName?.toString() ?: targetSub.carrierName?.toString() ?: "SIM $simSlot"
                }
            }

            if (selectedSubId != -1) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    getSystemService(SmsManager::class.java).createForSubscriptionId(selectedSubId)
                } else {
                    @Suppress("DEPRECATION")
                    SmsManager.getSmsManagerForSubscriptionId(selectedSubId)
                }
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }

        val parts = smsManager.divideMessage(message)
        if (parts.size > 1) {
            smsManager.sendMultipartTextMessage(to, null, parts, null, null)
        } else {
            smsManager.sendTextMessage(to, null, message, null, null)
        }

        return carrierName
    }

    private fun getDetectedSimCards(): List<Map<String, Any>> {
        val simList = mutableListOf<Map<String, Any>>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val subManager = getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            if (subManager != null && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                val activeSubs = subManager.activeSubscriptionInfoList
                if (!activeSubs.isNullOrEmpty()) {
                    for (info in activeSubs) {
                        simList.add(mapOf(
                            "slotIndex" to info.simSlotIndex,
                            "carrierName" to (info.displayName?.toString() ?: info.carrierName?.toString() ?: "Mobile Carrier"),
                            "subscriptionId" to info.subscriptionId,
                            "isFirstSim" to (info.simSlotIndex == 0)
                        ))
                    }
                }
            }
        }

        if (simList.isEmpty()) {
            simList.add(mapOf(
                "slotIndex" to 0,
                "carrierName" to "SIM 1 (Primary Slot)",
                "subscriptionId" to 1,
                "isFirstSim" to true
            ))
            simList.add(mapOf(
                "slotIndex" to 1,
                "carrierName" to "SIM 2 (Secondary Slot)",
                "subscriptionId" to 2,
                "isFirstSim" to false
            ))
        }
        return simList
    }

    private fun getBatteryLevelAndCharging(): Map<String, Any> {
        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1

        val pct = if (level >= 0 && scale > 0) (level * 100) / scale else 90
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL

        return mapOf(
            "level" to pct,
            "isCharging" to isCharging
        )
    }
}
