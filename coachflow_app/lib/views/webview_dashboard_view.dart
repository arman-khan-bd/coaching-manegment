import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/sms_polling_service.dart';

class WebViewDashboardView extends StatefulWidget {
  final String initialUrl;
  const WebViewDashboardView({Key? key, this.initialUrl = 'https://coaching-bd.netlify.app/'}) : super(key: key);

  @override
  State<WebViewDashboardView> createState() => _WebViewDashboardViewState();
}

class _WebViewDashboardViewState extends State<WebViewDashboardView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _canGoBack = false;
  bool _canGoForward = false;
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.initialUrl;

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF020617))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
              _currentUrl = url;
            });
          },
          onPageFinished: (String url) async {
            setState(() {
              _isLoading = false;
            });
            _updateNavState();
            _injectGatewayBridge();
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              _isLoading = false;
            });
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterGateway',
        onMessageReceived: (JavaScriptMessage msg) {
          _handleWebMessage(msg.message);
        },
      )
      ..loadRequest(Uri.parse(widget.initialUrl));
  }

  void _injectGatewayBridge() {
    const js = '''
      (function() {
        window.__IS_COACHFLOW_FLUTTER_APP__ = true;
        window.__ANDROID_GATEWAY_SIM1__ = {
          connected: true,
          platform: 'Flutter Native Android',
          slot: 1
        };

        // Detect logged-in coaching center ID and report to Flutter
        try {
          var raw = localStorage.getItem('coachflow_institute_settings');
          if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && (parsed.coachingCenterId || parsed.branchCode)) {
              var cid = parsed.coachingCenterId || parsed.branchCode;
              if (window.FlutterGateway) {
                window.FlutterGateway.postMessage(JSON.stringify({
                  type: 'COACHING_AUTH_SYNC',
                  coachingCenterId: cid
                }));
              }
            }
          }
        } catch(e) {}
      })();
    ''';
    _controller.runJavaScript(js);
  }

  void _handleWebMessage(String messageText) {
    try {
      final data = jsonDecode(messageText);
      final type = data['type'];

      if (type == 'COACHING_AUTH_SYNC' && data['coachingCenterId'] != null) {
        SmsPollingService().setCoachingCenterId(data['coachingCenterId'].toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text('কোচিং সেন্টার সিঙ্ক হয়েছে: ${data['coachingCenterId']}'),
            duration: const Duration(seconds: 2),
          ),
        );
      } else if (type == 'SEND_SMS') {
        final to = data['to']?.toString() ?? '';
        final message = data['message']?.toString() ?? '';
        if (to.isNotEmpty && message.isNotEmpty) {
          SmsPollingService().sendDirectTestSms(to, message);
        }
      }
    } catch (_) {}
  }

  Future<void> _updateNavState() async {
    final back = await _controller.canGoBack();
    final forward = await _controller.canGoForward();
    if (mounted) {
      setState(() {
        _canGoBack = back;
        _canGoForward = forward;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Navigation Control Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: const BoxDecoration(
            color: Color(0xFF0F172A),
            border: Border(bottom: BorderSide(color: Color(0xFF1E293B))),
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, size: 16),
                color: _canGoBack ? Colors.white : Colors.white24,
                onPressed: _canGoBack
                    ? () async {
                        await _controller.goBack();
                        _updateNavState();
                      }
                    : null,
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios, size: 16),
                color: _canGoForward ? Colors.white : Colors.white24,
                onPressed: _canGoForward
                    ? () async {
                        await _controller.goForward();
                        _updateNavState();
                      }
                    : null,
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                icon: const Icon(Icons.refresh, size: 18),
                color: Colors.white70,
                onPressed: () => _controller.reload(),
                visualDensity: VisualDensity.compact,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF020617),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Text(
                    _currentUrl,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontFamily: 'monospace'),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Linear Progress bar during page load
        if (_isLoading)
          const LinearProgressIndicator(
            backgroundColor: Color(0xFF0F172A),
            color: Color(0xFF6366F1),
            minHeight: 2,
          ),

        // Main WebView Content
        Expanded(
          child: WebViewWidget(controller: _controller),
        ),
      ],
    );
  }
}
