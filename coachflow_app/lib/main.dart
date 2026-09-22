import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/sms_native_service.dart';
import 'services/sms_polling_service.dart';
import 'views/api_docs_view.dart';
import 'views/sms_gateway_view.dart';
import 'views/webview_dashboard_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Color(0xFF020617),
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0F172A),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  final service = SmsPollingService();
  await service.initialize();
  await SmsNativeService.requestPermissions();

  runApp(const CoachFlowApp());
}

class CoachFlowApp extends StatelessWidget {
  const CoachFlowApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CoachFlow Android Gateway',
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
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  final SmsPollingService _pollingService = SmsPollingService();

  final List<Widget> _screens = const [
    WebViewDashboardView(),
    SmsGatewayView(),
    ApiDocsView(),
  ];

  @override
  void initState() {
    super.initState();
    _pollingService.addListener(_onServiceUpdate);
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _pollingService.removeListener(_onServiceUpdate);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'CoachFlow',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Flutter Android Gateway & Admin',
              style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: _pollingService.pollingActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'SIM 1: Active',
                  style: TextStyle(fontSize: 11, color: Color(0xFFE2E8F0), fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0F172A),
          border: Border(top: BorderSide(color: Color(0xFF1E293B))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF818CF8),
          unselectedItemColor: const Color(0xFF64748B),
          selectedFontSize: 11,
          unselectedFontSize: 11,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.language, size: 20),
              label: 'Web Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.cell_tower, size: 20),
              label: 'SMS Gateway',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.code, size: 20),
              label: 'REST API',
            ),
          ],
        ),
      ),
    );
  }
}
