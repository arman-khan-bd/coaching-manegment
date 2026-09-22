package com.coachflow.gateway.sms

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import kotlin.concurrent.thread

/**
 * Lightweight, zero-dependency embedded HTTP Server running locally on the Android device.
 * Exposes /api/sms/send and /api/sms/status endpoints for external callers and netlify servers.
 */
class LocalHttpServer(
    private val context: Context,
    private val port: Int,
    private val expectedApiKey: String,
    private val onSendSmsRequested: (to: String, message: String) -> Boolean
) {
    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private val TAG = "LocalHttpServer"

    fun start() {
        if (isRunning) return
        isRunning = true

        thread(name = "CoachFlowHttpServer") {
            try {
                serverSocket = ServerSocket(port)
                Log.i(TAG, "Local SMS Gateway HTTP Server running on port $port")

                while (isRunning && serverSocket?.isClosed == false) {
                    try {
                        val clientSocket = serverSocket?.accept() ?: break
                        thread { handleClient(clientSocket) }
                    } catch (e: Exception) {
                        if (!isRunning) break
                        Log.e(TAG, "Error accepting client connection", e)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start HTTP server on port $port", e)
            }
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
            serverSocket = null
            Log.i(TAG, "Local SMS Gateway HTTP Server stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping HTTP server", e)
        }
    }

    private fun handleClient(socket: Socket) {
        try {
            val reader = BufferedReader(InputStreamReader(socket.getInputStream()))
            val output: OutputStream = socket.getOutputStream()

            val requestLine = reader.readLine() ?: return
            val parts = requestLine.split(" ")
            if (parts.size < 2) return

            val method = parts[0]
            val path = parts[1]

            // Read headers
            var line: String?
            var contentLength = 0
            var authHeader: String? = null
            var apiKeyHeader: String? = null

            while (reader.readLine().also { line = it } != null) {
                if (line.isNullOrEmpty()) break
                val lower = line!!.lowercase()
                if (lower.startsWith("content-length:")) {
                    contentLength = line!!.substringAfter(":").trim().toIntOrNull() ?: 0
                }
                if (lower.startsWith("authorization:")) {
                    authHeader = line!!.substringAfter(":").trim()
                }
                if (lower.startsWith("x-api-key:")) {
                    apiKeyHeader = line!!.substringAfter(":").trim()
                }
            }

            // CORS preflight
            if (method.equals("OPTIONS", ignoreCase = true)) {
                sendResponse(output, 200, "OK", "application/json", "{\"status\":\"ok\"}")
                socket.close()
                return
            }

            // Route: GET /api/sms/status
            if (method.equals("GET", ignoreCase = true) && path.startsWith("/api/sms/status")) {
                val json = JSONObject().apply {
                    put("connected", true)
                    put("device", "CoachFlow Android SMS Gateway")
                    put("simSlot", 1)
                    put("serverPort", port)
                    put("status", "online")
                }
                sendResponse(output, 200, "OK", "application/json", json.toString())
                socket.close()
                return
            }

            // Route: POST /api/sms/send
            if (method.equals("POST", ignoreCase = true) && path.startsWith("/api/sms/send")) {
                // Read request body
                val bodyChars = CharArray(contentLength)
                var readTotal = 0
                while (readTotal < contentLength) {
                    val count = reader.read(bodyChars, readTotal, contentLength - readTotal)
                    if (count <= 0) break
                    readTotal += count
                }
                val body = String(bodyChars)

                // Validate API Key
                var keyProvided = apiKeyHeader
                if (keyProvided == null && authHeader != null) {
                    if (authHeader.startsWith("Bearer ", ignoreCase = true)) {
                        keyProvided = authHeader.substring(7).trim()
                    }
                }

                val jsonBody = try { JSONObject(body) } catch (e: Exception) { JSONObject() }
                if (keyProvided == null && jsonBody.has("apiKey")) {
                    keyProvided = jsonBody.optString("apiKey")
                }

                if (expectedApiKey.isNotEmpty() && keyProvided != expectedApiKey) {
                    val errJson = JSONObject().apply {
                        put("success", false)
                        put("error", "Unauthorized: Invalid API Key")
                    }
                    sendResponse(output, 401, "Unauthorized", "application/json", errJson.toString())
                    socket.close()
                    return
                }

                val to = jsonBody.optString("to", "")
                val message = jsonBody.optString("message", "")

                if (to.isEmpty() || message.isEmpty()) {
                    val errJson = JSONObject().apply {
                        put("success", false)
                        put("error", "Missing 'to' or 'message' fields")
                    }
                    sendResponse(output, 400, "Bad Request", "application/json", errJson.toString())
                    socket.close()
                    return
                }

                // Dispatch SMS via SIM 1
                val sent = onSendSmsRequested(to, message)
                val respJson = JSONObject().apply {
                    put("success", sent)
                    put("simSlot", 1)
                    put("to", to)
                    put("messageId", "msg_${System.currentTimeMillis()}")
                    put("timestamp", System.currentTimeMillis())
                }

                sendResponse(output, if (sent) 200 else 500, if (sent) "OK" else "Internal Server Error", "application/json", respJson.toString())
                socket.close()
                return
            }

            // 404 for other paths
            sendResponse(output, 404, "Not Found", "application/json", "{\"error\":\"Not Found\"}")
            socket.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error handling client request", e)
            try { socket.close() } catch (_: Exception) {}
        }
    }

    private fun sendResponse(
        out: OutputStream,
        statusCode: Int,
        statusText: String,
        contentType: String,
        body: String
    ) {
        val bytes = body.toByteArray(Charsets.UTF_8)
        val header = "HTTP/1.1 $statusCode $statusText\r\n" +
                "Content-Type: $contentType; charset=UTF-8\r\n" +
                "Content-Length: ${bytes.size}\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                "Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key\r\n" +
                "Connection: close\r\n\r\n"

        out.write(header.toByteArray(Charsets.UTF_8))
        out.write(bytes)
        out.flush()
    }
}
