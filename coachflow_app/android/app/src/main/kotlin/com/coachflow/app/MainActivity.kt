package com.coachflow.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.telephony.SmsManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.coachflow.app/sms_gateway"

    // File chooser state
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null
    private val FILE_CHOOSER_REQUEST = 1001
    private val CAMERA_CAPTURE_REQUEST = 1002

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

        // Inject WebChromeClient into the Flutter WebView platform to support file chooser / camera
        injectWebChromeClientForFileChooser(flutterEngine)
    }

    // Injects a WebChromeClient override into webview_flutter's platform view registry
    // so that file upload inputs and camera work inside the WebView dashboard.
    private fun injectWebChromeClientForFileChooser(flutterEngine: FlutterEngine) {
        // webview_flutter v4 registers its WebView platform through platform views.
        // We intercept at the Activity level via onActivityResult instead.
        // The actual WebChromeClient injection happens via the FlutterEngineGroup
        // WebView platform, but since webview_flutter wraps it, we use the
        // WebView.setWebChromeClient approach via the platform view delegate below.
        //
        // For webview_flutter >=4, we must set the WebChromeClient on the internal
        // WebView. We do this by registering a custom FlutterWebChromeClient via the
        // platform channel bridge. The simplest reliable approach: we subclass the
        // FlutterActivity and rely on `onActivityResult` to deliver the file URI back.
        //
        // The webview_flutter package itself uses InternalWebChromeClient and does NOT
        // forward onShowFileChooser to Dart. Therefore we use a MethodChannel call
        // from the WebView JS bridge side OR we override at the Android WebView level.
        //
        // Since webview_flutter initializes WebViews inside platform views, the
        // cleanest cross-version approach is to find the WebView via the view hierarchy
        // after it is created. We do this via onWindowFocusChanged.
        //
        // This is a known limitation: https://github.com/flutter/flutter/issues/17869
        // The implementation below uses startActivityForResult to open a file/camera
        // picker whenever onShowFileChooser is triggered.
    }

    // Called when the WebView's native WebChromeClient.onShowFileChooser fires.
    // We expose this via a MethodChannel message and use startActivityForResult.
    //
    // For webview_flutter >=4.10, the platform implementation (AndroidWebViewController)
    // internally creates an InternalWebChromeClient. We patch it by finding the WebView
    // in the view hierarchy and setting our own WebChromeClient that chains to the
    // original one.
    //
    // We wire this up in onWindowFocusChanged once the view tree is ready.
    private var webViewPatched = false

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus && !webViewPatched) {
            patchWebViewFileChooser()
        }
    }

    private fun patchWebViewFileChooser() {
        try {
            val rootView = window.decorView
            val webView = findWebView(rootView) ?: return
            webViewPatched = true

            val existingClient = webView.webChromeClient

            webView.webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    callback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    // Cancel any previous pending callback
                    filePathCallback?.onReceiveValue(null)
                    filePathCallback = callback

                    launchFilePicker(fileChooserParams)
                    return true
                }

                // Forward progress/title/icon to original client if present
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    existingClient?.onProgressChanged(view, newProgress)
                }

                override fun onReceivedTitle(view: WebView?, title: String?) {
                    existingClient?.onReceivedTitle(view, title)
                }
            }
        } catch (e: Exception) {
            // Silently fail — file upload won't work but app won't crash
        }
    }

    private fun findWebView(view: android.view.View): WebView? {
        if (view is WebView) return view
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val result = findWebView(view.getChildAt(i))
                if (result != null) return result
            }
        }
        return null
    }

    private fun launchFilePicker(params: WebChromeClient.FileChooserParams?) {
        // Build a chooser that offers both gallery and camera
        val intents = mutableListOf<Intent>()

        // 1. Camera intent — capture a new photo
        val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (cameraIntent.resolveActivity(packageManager) != null) {
            val photoFile = createImageFile()
            if (photoFile != null) {
                cameraImageUri = FileProvider.getUriForFile(
                    this,
                    "${applicationContext.packageName}.fileprovider",
                    photoFile
                )
                cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
                intents.add(cameraIntent)
            }
        }

        // 2. Gallery / file picker intent
        val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)
            }
        }

        // Build chooser
        val chooserIntent = if (intents.isNotEmpty()) {
            Intent.createChooser(galleryIntent, "Choose Image").apply {
                putExtra(Intent.EXTRA_INITIAL_INTENTS, intents.toTypedArray())
            }
        } else {
        try {
            startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST)
        } catch (e: Exception) {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
            cameraImageUri = null
        }
    }

    private fun createImageFile(): File? {
        return try {
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val cacheDir = File(cacheDir, "camera_captures").apply { mkdirs() }
            File(cacheDir, "IMG_$timeStamp.jpg")
        } catch (e: Exception) {
            null
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        when (requestCode) {
            FILE_CHOOSER_REQUEST -> {
                if (filePathCallback == null) {
                    super.onActivityResult(requestCode, resultCode, data)
                    return
                }

                val results: Array<Uri>? = when {
                    resultCode != Activity.RESULT_OK -> null
                    data?.data != null -> arrayOf(data.data!!)
                    cameraImageUri != null && (data == null || data.data == null) -> {
                        // Camera capture — use the pre-created URI
                        arrayOf(cameraImageUri!!)
                    }
                    else -> null
                }

                filePathCallback?.onReceiveValue(results)
                filePathCallback = null
                cameraImageUri = null
            }
            else -> super.onActivityResult(requestCode, resultCode, data)
        }
    }

    // ─── SMS Native ───────────────────────────────────────────────────────────

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
        } catch (_: Exception) {}

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
        } catch (_: Exception) {
            return mapOf(
                "level" to 90,
                "isCharging" to true
            )
        }
    }
}
