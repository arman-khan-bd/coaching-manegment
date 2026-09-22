import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/sms_polling_service.dart';

class WebViewDashboardView extends StatefulWidget {
  final String initialUrl;
  const WebViewDashboardView({Key? key, this.initialUrl = 'https://coaching-bd.netlify.app/dashboard'}) : super(key: key);

  @override
  State<WebViewDashboardView> createState() => _WebViewDashboardViewState();
}

class _WebViewDashboardViewState extends State<WebViewDashboardView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _canGoBack = false;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF020617))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
              });
            }
          },
          onPageFinished: (String url) async {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
            _updateNavState();
            _injectGatewayBridge();
          },
          onWebResourceError: (WebResourceError error) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
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

        // If user has saved session and on login or home, jump direct to dashboard
        try {
          var authKey = Object.keys(localStorage).find(function(k) { return k.indexOf('-auth-token') !== -1; });
          var hasAuth = authKey && localStorage.getItem(authKey);
          if (hasAuth && (window.location.pathname === '/login' || window.location.pathname === '/signin' || window.location.pathname === '/')) {
            window.location.replace('/dashboard/overview');
          }

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
    if (mounted) {
      setState(() {
        _canGoBack = back;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_canGoBack,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (_canGoBack) {
          await _controller.goBack();
          _updateNavState();
        }
      },
      child: Stack(
        children: [
          // Fullscreen Web Content (Zero Browser Chrome)
          Positioned.fill(
            child: WebViewWidget(controller: _controller),
          ),

          // Minimal 2.5px Top Accent Loading Line
          if (_isLoading)
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                backgroundColor: Colors.transparent,
                color: Color(0xFF6366F1),
                minHeight: 2.5,
              ),
            ),
        ],
      ),
    );
  }
}
