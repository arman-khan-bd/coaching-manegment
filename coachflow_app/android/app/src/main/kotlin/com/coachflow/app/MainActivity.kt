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
                    val to = normalizePhoneNumber(call.argument<String>("to") ?: "")
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
                    } catch (t: Throwable) {
                        result.error("SEND_FAILED", t.message ?: "Failed to send SMS", null)
                    }
                }

                "getSimCards" -> {
                    try {
                        val sims = getDetectedSimCards()
                        result.success(sims)
                    } catch (t: Throwable) {
                        result.success(getFallbackSimCards())
                    }
                }

                "getBatteryStatus" -> {
                    try {
                        val battery = getBatteryLevelAndCharging()
                        result.success(battery)
                    } catch (t: Throwable) {
                        result.success(mapOf("level" to 85, "isCharging" to false))
                    }
                }

                else -> result.notImplemented()
            }
        }
    }

    private fun normalizePhoneNumber(raw: String): String {
        if (raw.isBlank()) return ""
        val bengaliDigits = mapOf(
            '০' to '0', '১' to '1', '২' to '2', '৩' to '3', '৪' to '4',
            '৫' to '5', '৬' to '6', '৭' to '7', '৮' to '8', '৯' to '9'
        )
        val converted = raw.map { bengaliDigits[it] ?: it }.joinToString("")
        val hasPlus = converted.trim().startsWith("+")
        val digits = converted.filter { it.isDigit() }

        if (digits.isEmpty()) return raw.trim()

        return when {
            digits.length == 11 && digits.matches(Regex("^01[3-9]\\d{8}$")) -> "+88$digits"
            digits.length == 13 && digits.matches(Regex("^8801[3-9]\\d{8}$")) -> "+$digits"
            digits.length == 10 && digits.matches(Regex("^1[3-9]\\d{8}$")) -> "+880$digits"
            hasPlus && digits.length >= 7 -> "+$digits"
            digits.length == 11 && digits.startsWith("01") -> "+88$digits"
            digits.length >= 11 && digits.startsWith("880") -> "+$digits"
            digits.length == 11 && digits.startsWith("0") -> "+88$digits"
            hasPlus -> "+$digits"
            else -> digits
        }
    }

    private fun sendNativeSms(to: String, message: String, simSlot: Int): String {
        var carrierName = "Primary SIM"
        val normalizedTo = normalizePhoneNumber(to)

        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val subManager = try {
                getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            } catch (t: Throwable) {
                null
            }
            var selectedSubId = -1

            if (subManager != null && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                try {
                    val activeSubs: List<SubscriptionInfo>? = subManager.activeSubscriptionInfoList
                    if (!activeSubs.isNullOrEmpty()) {
                        val targetSub = activeSubs.firstOrNull { it.simSlotIndex == (simSlot - 1) } ?: activeSubs[0]
                        selectedSubId = targetSub.subscriptionId
                        carrierName = targetSub.displayName?.toString() ?: targetSub.carrierName?.toString() ?: "SIM $simSlot"
                    }
                } catch (t: Throwable) {}
            }

            if (selectedSubId != -1) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        getSystemService(SmsManager::class.java).createForSubscriptionId(selectedSubId)
                    } else {
                        @Suppress("DEPRECATION")
                        SmsManager.getSmsManagerForSubscriptionId(selectedSubId)
                    }
                } catch (t: Throwable) {
                    @Suppress("DEPRECATION")
                    SmsManager.getDefault()
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
            smsManager.sendMultipartTextMessage(normalizedTo, null, parts, null, null)
        } else {
            smsManager.sendTextMessage(normalizedTo, null, message, null, null)
        }

        return carrierName
    }

    private fun getDetectedSimCards(): List<Map<String, Any>> {
        val simList = mutableListOf<Map<String, Any>>()
        try {
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
        } catch (t: Throwable) {}

        if (simList.isEmpty()) {
            return getFallbackSimCards()
        }
        return simList
    }

    private fun getFallbackSimCards(): List<Map<String, Any>> {
        return listOf(
            mapOf(
                "slotIndex" to 0,
                "carrierName" to "SIM 1 (Primary Slot)",
                "subscriptionId" to 1,
                "isFirstSim" to true
            ),
            mapOf(
                "slotIndex" to 1,
                "carrierName" to "SIM 2 (Secondary Slot)",
                "subscriptionId" to 2,
                "isFirstSim" to false
            )
        )
    }

    private fun getBatteryLevelAndCharging(): Map<String, Any> {
        try {
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
        } catch (t: Throwable) {
            return mapOf(
                "level" to 90,
                "isCharging" to true
            )
        }
    }
}
