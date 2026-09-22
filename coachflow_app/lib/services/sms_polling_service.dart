import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/sms_item.dart';
import 'sms_native_service.dart';

class SmsPollingService extends ChangeNotifier {
  static final SmsPollingService _instance = SmsPollingService._internal();
  factory SmsPollingService() => _instance;
  SmsPollingService._internal();

  String _coachingCenterId = 'aac-dhaka-01';
  String _apiBaseUrl = 'https://coaching-bd.netlify.app';
  bool _pollingActive = true;
  int _pollCountdown = 10;
  String _lastPollTime = 'পোলিং শুরু হয়নি';
  String _lastPollStatus = '১০-সেকেন্ড পোলিং সক্রিয় ও প্রস্তুত';
  bool _isPolling = false;
  int _dailySent = 284;
  final int _dailyLimit = 1500;

  final List<SmsLogItem> _logs = [
    SmsLogItem(
      id: '1',
      time: '17:31:04',
      to: '+880 1711-456789',
      message: 'সম্মানিত অভিভাবক, ফারহান শাকিল আজ ক্লাসে অনুপস্থিত ছিল।',
      status: 'sent',
      simSlot: 1,
    ),
    SmsLogItem(
      id: '2',
      time: '17:28:19',
      to: '+880 1819-234567',
      message: 'সম্মানিত অভিভাবক, নাফিসা আনজুম গণিত পরীক্ষায় প্রাপ্ত নম্বর: ৯৪/১০০ (A+)।',
      status: 'sent',
      simSlot: 1,
    ),
  ];

  Timer? _countdownTimer;

  // Getters
  String get coachingCenterId => _coachingCenterId;
  String get apiBaseUrl => _apiBaseUrl;
  bool get pollingActive => _pollingActive;
  int get pollCountdown => _pollCountdown;
  String get lastPollTime => _lastPollTime;
  String get lastPollStatus => _lastPollStatus;
  bool get isPolling => _isPolling;
  int get dailySent => _dailySent;
  int get dailyLimit => _dailyLimit;
  List<SmsLogItem> get logs => List.unmodifiable(_logs);

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _coachingCenterId = prefs.getString('coaching_center_id') ?? 'aac-dhaka-01';
    _apiBaseUrl = prefs.getString('api_base_url') ?? 'https://coaching-bd.netlify.app';
    _dailySent = prefs.getInt('daily_sent') ?? 284;
    _pollingActive = prefs.getBool('polling_active') ?? true;

    startPollingTimer();
    notifyListeners();
  }

  void startPollingTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_pollingActive) return;

      if (_pollCountdown <= 1) {
        _pollCountdown = 10;
        executePollQueue();
      } else {
        _pollCountdown--;
      }
      notifyListeners();
    });
  }

  Future<void> setCoachingCenterId(String newId) async {
    if (newId.trim().isEmpty) return;
    _coachingCenterId = newId.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('coaching_center_id', _coachingCenterId);
    _lastPollStatus = 'লগইন আইডি সেট: $_coachingCenterId';
    notifyListeners();
  }

  Future<void> setApiBaseUrl(String newUrl) async {
    if (newUrl.trim().isEmpty) return;
    _apiBaseUrl = newUrl.trim().replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', _apiBaseUrl);
    notifyListeners();
  }

  void togglePolling() {
    _pollingActive = !_pollingActive;
    SharedPreferences.getInstance().then((prefs) {
      prefs.setBool('polling_active', _pollingActive);
    });
    notifyListeners();
  }

  static const String _supabaseUrl = 'https://qmrpvrsysbbmjxjdrzaj.supabase.co';
  static const String _supabaseAnonKey = 'sb_publishable_ibH84sYVdp6hleVaGN_i4g_6PQX3ajJ';

  /// Core 10-Second Poller
  Future<void> executePollQueue() async {
    if (_coachingCenterId.trim().isEmpty || _isPolling) return;
    _isPolling = true;
    notifyListeners();

    final now = DateTime.now();
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';

    try {
      final cleanBase = _apiBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
      final cleanId = Uri.encodeComponent(_coachingCenterId.trim());
      final endpoint = Uri.parse('$cleanBase/api/sms/$cleanId');

      List rawMessages = [];
      bool fetchedFromApi = false;

      // 1. Try Main Domain / Netlify Endpoint First
      try {
        final response = await http.get(endpoint, headers: {
          'Accept': 'application/json',
        }).timeout(const Duration(seconds: 5));

        final bodyStr = response.body.trim();
        if (response.statusCode == 200 && (bodyStr.startsWith('{') || bodyStr.startsWith('['))) {
          final data = jsonDecode(bodyStr);
          if (data is Map && data['messages'] is List) {
            rawMessages = data['messages'] as List;
            fetchedFromApi = true;
          }
        }
      } catch (_) {
        // Fallback to Supabase
      }

      // 2. Direct Supabase REST Fallback if Netlify didn't return JSON
      if (!fetchedFromApi) {
        try {
          final sbEndpoint = Uri.parse(
            '$_supabaseUrl/rest/v1/sms_queue?coaching_center_id=eq.$cleanId&status=eq.pending&order=created_at.asc&limit=10'
          );
          final sbResp = await http.get(sbEndpoint, headers: {
            'apikey': _supabaseAnonKey,
            'Authorization': 'Bearer $_supabaseAnonKey',
            'Accept': 'application/json',
          }).timeout(const Duration(seconds: 5));

          if (sbResp.statusCode == 200) {
            final sbData = jsonDecode(sbResp.body);
            if (sbData is List) {
              rawMessages = sbData.map((row) => {
                'id': row['id'],
                'to': row['recipient_phone'],
                'recipientName': row['recipient_name'] ?? '',
                'message': row['message'],
                'coachingCenterId': row['coaching_center_id'],
                'createdAt': row['created_at'],
              }).toList();
            }
          }
        } catch (_) {}
      }

      _lastPollTime = timeStr;

      if (rawMessages.isEmpty) {
        // "and not get not send"
        _lastPollStatus = 'কোনো পেন্ডিং SMS নেই (Next check in 10s) — $timeStr';
        return;
      }

      // "if found send sms using sim"
      _lastPollStatus = '${rawMessages.length}টি SMS পাওয়া গেছে, SIM 1 দিয়ে প্রেরণ চলছে...';
      notifyListeners();

      for (var raw in rawMessages) {
        final item = SmsQueueItem.fromJson(Map<String, dynamic>.from(raw));
        _appendLog(item.to, item.message, 'processing');

        final sendResult = await SmsNativeService.sendSms(item.to, item.message, simSlot: 1);
        final isSent = sendResult['success'] == true;
        final targetStatus = isSent ? 'sent' : 'failed';
        final errorMsg = sendResult['error']?.toString();

        if (isSent) {
          _dailySent++;
          _updateLatestLogStatus('sent');
        } else {
          _updateLatestLogStatus('failed');
        }

        // 1. Report status to Netlify / Web API
        final statusEndpoint = Uri.parse('$cleanBase/api/sms/$cleanId/status');
        http.post(
          statusEndpoint,
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: jsonEncode({
            'id': item.id,
            'status': targetStatus,
            'simSlot': 1,
            'errorMessage': errorMsg,
          }),
        ).catchError((_) => http.Response('', 500));

        // 2. Report status to Supabase REST directly
        final nowIso = DateTime.now().toUtc().toIso8601String();
        final sbUpdateUrl = Uri.parse(
          '$_supabaseUrl/rest/v1/sms_queue?id=eq.${Uri.encodeComponent(item.id)}'
        );
        http.patch(
          sbUpdateUrl,
          headers: {
            'apikey': _supabaseAnonKey,
            'Authorization': 'Bearer $_supabaseAnonKey',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: jsonEncode({
            'status': targetStatus,
            'sim_slot': 1,
            'error_message': errorMsg,
            'sent_at': isSent ? nowIso : null,
          }),
        ).catchError((_) => http.Response('', 500));
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('daily_sent', _dailySent);
    } catch (e) {
      _lastPollTime = timeStr;
      _lastPollStatus = 'সংযোগ ত্রুটি (${e.toString()}) — $timeStr';
    } finally {
      _isPolling = false;
      notifyListeners();
    }
  }

  /// Send quick test SMS directly via SIM 1
  Future<Map<String, dynamic>> sendDirectTestSms(String to, String message) async {
    _appendLog(to, message, 'processing');
    final res = await SmsNativeService.sendSms(to, message, simSlot: 1);
    if (res['success'] == true) {
      _dailySent++;
      _updateLatestLogStatus('sent');
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('daily_sent', _dailySent);
    } else {
      _updateLatestLogStatus('failed');
    }
    notifyListeners();
    return res;
  }

  void _appendLog(String to, String message, String status) {
    final now = DateTime.now();
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    _logs.insert(
      0,
      SmsLogItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        time: timeStr,
        to: to,
        message: message,
        status: status,
        simSlot: 1,
      ),
    );
    if (_logs.length > 100) _logs.removeLast();
    notifyListeners();
  }

  void _updateLatestLogStatus(String status) {
    if (_logs.isNotEmpty) {
      final first = _logs[0];
      _logs[0] = SmsLogItem(
        id: first.id,
        time: first.time,
        to: first.to,
        message: first.message,
        status: status,
        simSlot: first.simSlot,
      );
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }
}
