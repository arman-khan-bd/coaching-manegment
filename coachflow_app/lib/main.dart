import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/sms_native_service.dart';
import 'services/sms_polling_service.dart';
import 'views/api_docs_view.dart';
import 'views/sms_gateway_view.dart';
import 'views/webview_dashboard_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Defensive global error boundaries: prevent any uncaught error from closing the app
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('[CoachFlow Error] FlutterError: ${details.exceptionAsString()}');
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('[CoachFlow Error] PlatformDispatcher: $error\n$stack');
    return true; // Mark as handled so process does not crash
  };

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF020617),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Run app immediately so Android window renders first frame without watchdog timeout
  runApp(const CoachFlowApp());
}

class CoachFlowApp extends StatelessWidget {
  const CoachFlowApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CoachFlow',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF020617),
        primaryColor: const Color(0xFF6366F1),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF0F172A),
          background: Color(0xFF020617),
        ),
        fontFamily: 'Roboto',
      ),
      home: const MainDashboardScreen(),
    );
  }
}

class MainDashboardScreen extends StatefulWidget {
  const MainDashboardScreen({Key? key}) : super(key: key);

  @override
  State<MainDashboardScreen> createState() => _MainDashboardScreenState();
}

class _MainDashboardScreenState extends State<MainDashboardScreen> {
  final SmsPollingService _pollingService = SmsPollingService();

  // Floating button draggable position
  Offset? _fabPosition;
  double _dragDistance = 0.0;

  @override
  void initState() {
    super.initState();
    _pollingService.addListener(_onServiceUpdate);

    // Initialize polling and check permissions safely AFTER first frame renders
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await _pollingService.initialize();
      } catch (e) {
        debugPrint('[CoachFlow] Polling service init error: $e');
      }

      // Safe delayed permission check to avoid any activity startup collision
      Future.delayed(const Duration(milliseconds: 600), () async {
        try {
          await SmsNativeService.requestPermissions();
        } catch (e) {
          debugPrint('[CoachFlow] Permission request error: $e');
        }
      });
    });
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _pollingService.removeListener(_onServiceUpdate);
    super.dispose();
  }

  void _openGatewayModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return const GatewayTabsBottomSheet();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final screenSize = mediaQuery.size;
    final padding = mediaQuery.padding;

    // Default position: bottom right corner
    if (_fabPosition == null) {
      _fabPosition = Offset(screenSize.width - 76.0, screenSize.height - padding.bottom - 90.0);
    } else {
      // Re-clamp if screen orientation/size changed
      final clampedX = _fabPosition!.dx.clamp(12.0, screenSize.width - 76.0);
      final clampedY = _fabPosition!.dy.clamp(padding.top + 12.0, screenSize.height - padding.bottom - 76.0);
      _fabPosition = Offset(clampedX, clampedY);
    }

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      // No top AppBar (fullscreen immersive dashboard)
      // No bottomNavigationBar (clean webview area)
      body: SafeArea(
        top: true,
        bottom: false,
        child: Stack(
          children: [
            // 1. FULLSCREEN IMMERSIVE WEBVIEW (DIRECT TO /dashboard ROUTE)
            const Positioned.fill(
              child: WebViewDashboardView(
                initialUrl: 'https://ihut.shop/dashboard',
              ),
            ),

            // 2. MOVABLE DRAGGABLE FLOATING SMS GATEWAY BUTTON
            Positioned(
              left: _fabPosition!.dx,
              top: _fabPosition!.dy,
              child: GestureDetector(
                onPanStart: (details) {
                  _dragDistance = 0.0;
                },
                onPanUpdate: (details) {
                  _dragDistance += details.delta.distance;
                  setState(() {
                    double newX = (_fabPosition!.dx + details.delta.dx).clamp(12.0, screenSize.width - 76.0);
                    double newY = (_fabPosition!.dy + details.delta.dy).clamp(padding.top + 12.0, screenSize.height - padding.bottom - 76.0);
                    _fabPosition = Offset(newX, newY);
                  });
                },
                onPanEnd: (details) {
                  // If movement was minimal, consider it a tap
                  if (_dragDistance < 8.0) {
                    _openGatewayModal(context);
                  }
                },
                onTap: () {
                  _openGatewayModal(context);
                },
                child: _buildFloatingSmsButton(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingSmsButton() {
    final activeSlot = _pollingService.preferredSimSlot;
    final isOnline = _pollingService.pollingActive;

    return Material(
      color: Colors.transparent,
      child: Container(
        width: 62,
        height: 62,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF4338CA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6366F1).withOpacity(0.55),
              blurRadius: 16,
              spreadRadius: 2,
              offset: const Offset(0, 6),
            ),
          ],
          border: Border.all(
            color: const Color(0xFF818CF8).withOpacity(0.6),
            width: 1.5,
          ),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // Center SMS Icon
            const Icon(
              Icons.sms_rounded,
              color: Colors.white,
              size: 27,
            ),

            // Top Status Chip: SIM 1 / SIM 2 + Active Dot
            Positioned(
              top: -6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 3),
                    Text(
                      'SIM $activeSlot',
                      style: const TextStyle(
                        fontSize: 8.5,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Grip Hint Dots
            Positioned(
              bottom: 4,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(
                  3,
                  (index) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 1.5),
                    width: 2.5,
                    height: 2.5,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.65),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Modal Bottom Sheet holding SMS Gateway (with SIM selecting) and REST API tabs
class GatewayTabsBottomSheet extends StatelessWidget {
  const GatewayTabsBottomSheet({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final sheetHeight = MediaQuery.of(context).size.height * 0.90;

    return DefaultTabController(
      length: 2,
      child: Container(
        height: sheetHeight,
        decoration: const BoxDecoration(
          color: Color(0xFF020617),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(
            top: BorderSide(color: Color(0xFF334155), width: 1.2),
          ),
        ),
        child: Column(
          children: [
            // Top Notch Drag Handle
            const SizedBox(height: 10),
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFF475569),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Top Header: Tab Selector & Close Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Row(
                children: [
                  // Tab Switcher
                  Expanded(
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF1E293B)),
                      ),
                      child: TabBar(
                        indicator: BoxDecoration(
                          color: const Color(0xFF4F46E5),
                          borderRadius: BorderRadius.circular(9),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F46E5).withOpacity(0.4),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        labelColor: Colors.white,
                        unselectedLabelColor: const Color(0xFF94A3B8),
                        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
                        indicatorSize: TabBarIndicatorSize.tab,
                        tabs: const [
                          Tab(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.cell_tower_rounded, size: 16),
                                SizedBox(width: 6),
                                Text('SMS Gateway (SIM)'),
                              ],
                            ),
                          ),
                          Tab(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.code_rounded, size: 16),
                                SizedBox(width: 6),
                                Text('REST API'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Close Button
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white70, size: 22),
                    onPressed: () => Navigator.pop(context),
                    tooltip: 'বন্ধ করুন',
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
            ),
            const Divider(color: Color(0xFF1E293B), height: 1),

            // Tab Views: Tab 1 = SmsGatewayView, Tab 2 = ApiDocsView
            const Expanded(
              child: TabBarView(
                children: [
                  SmsGatewayView(),
                  ApiDocsView(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
