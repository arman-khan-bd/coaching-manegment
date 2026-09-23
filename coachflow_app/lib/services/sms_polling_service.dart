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

  static final Map<String, String> _bengaliDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };

  /// Universal Phone Normalizer:
  /// Converts Bengali digits, strips non-digits, and converts 01..., 8801..., 17... to standard +8801XXXXXXXXX
  static String normalizePhoneNumber(String raw) {
    if (raw.trim().isEmpty) return '';
    String str = raw.trim();
    _bengaliDigits.forEach((key, value) {
      str = str.replaceAll(key, value);
    });
    final hasPlus = str.startsWith('+');
    final digits = str.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return raw.trim();

    if (digits.length == 11 && RegExp(r'^01[3-9]\d{8}$').hasMatch(digits)) {
      return '+88$digits';
    }
    if (digits.length == 13 && RegExp(r'^8801[3-9]\d{8}$').hasMatch(digits)) {
      return '+$digits';
    }
    if (digits.length == 10 && RegExp(r'^1[3-9]\d{8}$').hasMatch(digits)) {
      return '+880$digits';
    }
    if (hasPlus && digits.length >= 7) {
      return '+$digits';
    }
    if (digits.length == 11 && digits.startsWith('01')) {
      return '+88$digits';
    }
    if (digits.length >= 11 && digits.startsWith('880')) {
      return '+$digits';
    }
    if (digits.length == 11 && digits.startsWith('0')) {
      return '+88$digits';
    }
    return hasPlus ? '+$digits' : digits;
  }

  String _coachingCenterId = 'aac-dhaka-01';
  String _apiBaseUrl = 'https://ihut.shop';
  bool _pollingActive = true;
  int _pollCountdown = 30;
  String _lastPollTime = 'রিয়েলটাইম প্রস্তুত';
  String _lastPollStatus = '⚡ Supabase Realtime সক্রিয় (তাত্ক্ষণিক পুশ)';
  bool _isPolling = false;
  int _dailySent = 284;
  final int _dailyLimit = 1500;
  final Set<String> _processedSmsIds = {};
  /// 15-second content & phone deduplication cache preventing duplicate SMS dispatch
  final Map<String, DateTime> _recentSmsFingerprints = {};

  bool _isDuplicateRecentSms(String to, String message) {
    final now = DateTime.now();
    _recentSmsFingerprints.removeWhere((_, time) => now.difference(time).inSeconds > 30);
    final key = '${normalizePhoneNumber(to)}|${message.trim()}';
    final lastSent = _recentSmsFingerprints[key];
    if (lastSent != null && now.difference(lastSent).inSeconds < 15) {
      debugPrint('[Deduplication] Blocked duplicate SMS to $to within 15 seconds.');
      return true;
    }
    _recentSmsFingerprints[key] = now;
    return false;
  }

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

  int _preferredSimSlot = 1;

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
  int get preferredSimSlot => _preferredSimSlot;
  List<SmsLogItem> get logs => List.unmodifiable(_logs);

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _coachingCenterId = prefs.getString('coaching_center_id') ?? 'aac-dhaka-01';
    _apiBaseUrl = prefs.getString('api_base_url') ?? 'https://ihut.shop';
    _dailySent = prefs.getInt('daily_sent') ?? 284;
    _pollingActive = prefs.getBool('polling_active') ?? true;
    _preferredSimSlot = prefs.getInt('preferred_sim_slot') ?? 1;

    startPollingTimer();
    notifyListeners();
  }

  Future<void> setPreferredSimSlot(int slot) async {
    if (slot != 1 && slot != 2) return;
    _preferredSimSlot = slot;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('preferred_sim_slot', slot);
    _lastPollStatus = 'সক্রিয় সিম সেট: SIM $slot';
    notifyListeners();
  }

  void startPollingTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_pollingActive) return;

      if (_pollCountdown <= 1) {
        _pollCountdown = 30;
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

      // 1. Try Main Domain / Cloud API Endpoint First
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

      // 2. Direct Supabase REST Fallback if Cloud API didn't return JSON
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
        _lastPollStatus = '⚡ Realtime সক্রিয় (কোনো পেন্ডিং নেই) — $timeStr';
        return;
      }

      // Filter out any messages already dispatched instantly via Realtime
      final pendingToProcess = rawMessages.where((raw) {
        final id = raw['id']?.toString() ?? '';
        return id.isEmpty || !_processedSmsIds.contains(id);
      }).toList();

      if (pendingToProcess.isEmpty) {
        _lastPollStatus = '⚡ Realtime পুশ দ্বারা সকল SMS প্রক্রিয়া সম্পন্ন — $timeStr';
        return;
      }

      _lastPollStatus = '${pendingToProcess.length}টি পেন্ডিং SMS পাওয়া গেছে, SIM $_preferredSimSlot দিয়ে প্রেরণ চলছে...';
      notifyListeners();

      for (var raw in pendingToProcess) {
        final item = SmsQueueItem.fromJson(Map<String, dynamic>.from(raw));
        if (item.id.isNotEmpty) {
          _processedSmsIds.add(item.id);
          if (_processedSmsIds.length > 500) {
            _processedSmsIds.remove(_processedSmsIds.first);
          }
        }

        final normalizedTo = normalizePhoneNumber(item.to);
        final activeSlot = item.simSlot ?? _preferredSimSlot;

        // Skip if this exact SMS was already transmitted within 15 seconds
        if (_isDuplicateRecentSms(normalizedTo, item.message)) {
          debugPrint('[Poll Queue] Skipping duplicate SMS to $normalizedTo.');
          await _reportSmsStatusToRemote(
            id: item.id,
            status: 'sent',
            simSlot: activeSlot,
          );
          continue;
        }

        _appendLog(normalizedTo, item.message, 'processing', simSlot: activeSlot);

        final sendResult = await SmsNativeService.sendSms(normalizedTo, item.message, simSlot: activeSlot);
        final isSent = sendResult['success'] == true;
        final targetStatus = isSent ? 'sent' : 'failed';
        final errorMsg = sendResult['error']?.toString();

        if (isSent) {
          _dailySent++;
          _updateLatestLogStatus('sent');
        } else {
          _updateLatestLogStatus('failed');
        }

        await _reportSmsStatusToRemote(
          id: item.id,
          status: targetStatus,
          simSlot: activeSlot,
          errorMsg: errorMsg,
        );
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

  /// Instant 0-second SMS dispatch triggered by Supabase Realtime WebSocket event
  Future<void> sendInstantRealtimeSms({
    required String id,
    required String to,
    required String message,
    int? simSlot,
  }) async {
    if (to.trim().isEmpty || message.trim().isEmpty) return;
    if (id.isNotEmpty && _processedSmsIds.contains(id)) {
      debugPrint('[Realtime SMS] Item $id already processed, skipping duplicate.');
      return;
    }
    if (id.isNotEmpty) {
      _processedSmsIds.add(id);
      if (_processedSmsIds.length > 500) {
        _processedSmsIds.remove(_processedSmsIds.first);
      }
    }

    final now = DateTime.now();
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    final normalizedTo = normalizePhoneNumber(to);
    final activeSlot = simSlot ?? _preferredSimSlot;

    // Suppress if identical recipient + message was dispatched in the last 15 seconds
    if (_isDuplicateRecentSms(normalizedTo, message)) {
      debugPrint('[Realtime SMS] Suppressing duplicate SMS transmission to $normalizedTo.');
      if (id.isNotEmpty) {
        await _reportSmsStatusToRemote(
          id: id,
          status: 'sent',
          simSlot: activeSlot,
        );
      }
      return;
    }

    _appendLog(normalizedTo, message, 'processing', simSlot: activeSlot);
    _lastPollStatus = '⚡ Realtime SMS পাঠানো হচ্ছে: $normalizedTo (SIM $activeSlot)...';
    notifyListeners();

    try {
      final sendResult = await SmsNativeService.sendSms(normalizedTo, message, simSlot: activeSlot);
      final isSent = sendResult['success'] == true;
      final targetStatus = isSent ? 'sent' : 'failed';
      final errorMsg = sendResult['error']?.toString();

      if (isSent) {
        _dailySent++;
        _updateLatestLogStatus('sent');
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt('daily_sent', _dailySent);
        _lastPollStatus = '⚡ Realtime SMS প্রেরিত: $normalizedTo (SIM $activeSlot)';
      } else {
        _updateLatestLogStatus('failed');
        _lastPollStatus = '❌ SMS ব্যর্থ: ${errorMsg ?? "ত্রুটি"} ($normalizedTo)';
      }
      _lastPollTime = timeStr;
      notifyListeners();

      if (id.isNotEmpty) {
        await _reportSmsStatusToRemote(
          id: id,
          status: targetStatus,
          simSlot: activeSlot,
          errorMsg: errorMsg,
        );
      }
    } catch (e) {
      _lastPollTime = timeStr;
      _lastPollStatus = '❌ Realtime SMS ত্রুটি: $e';
      notifyListeners();
    }
  }

  /// Helper to report delivery status back to Cloud API and Supabase
  Future<void> _reportSmsStatusToRemote({
    required String id,
    required String status,
    required int simSlot,
    String? errorMsg,
  }) async {
    if (id.isEmpty) return;
    final isSent = status == 'sent';
    final cleanBase = _apiBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    final cleanId = Uri.encodeComponent(_coachingCenterId.trim());

    // 1. Report status to Cloud API / Web API
    if (cleanBase.isNotEmpty) {
      try {
        final statusEndpoint = Uri.parse('$cleanBase/api/sms/$cleanId/status');
        await http.post(
          statusEndpoint,
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: jsonEncode({
            'id': id,
            'status': status,
            'simSlot': simSlot,
            'errorMessage': errorMsg,
          }),
        ).timeout(const Duration(seconds: 4)).catchError((_) => http.Response('', 500));
      } catch (_) {}
    }

    // 2. Report status directly to Supabase REST
    try {
      final nowIso = DateTime.now().toUtc().toIso8601String();
      final sbUpdateUrl = Uri.parse(
        '$_supabaseUrl/rest/v1/sms_queue?id=eq.${Uri.encodeComponent(id)}'
      );
      await http.patch(
        sbUpdateUrl,
        headers: {
          'apikey': _supabaseAnonKey,
          'Authorization': 'Bearer $_supabaseAnonKey',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: jsonEncode({
          'status': status,
          'sim_slot': simSlot,
          'error_message': errorMsg,
          'sent_at': isSent ? nowIso : null,
        }),
      ).timeout(const Duration(seconds: 4)).catchError((_) => http.Response('', 500));
    } catch (_) {}
  }

  /// Send quick test SMS directly via selected SIM
  Future<Map<String, dynamic>> sendDirectTestSms(String to, String message, {int? simSlot}) async {
    final normalizedTo = normalizePhoneNumber(to);
    final activeSlot = simSlot ?? _preferredSimSlot;

    if (_isDuplicateRecentSms(normalizedTo, message)) {
      debugPrint('[Direct Test SMS] Suppressing duplicate test SMS to $normalizedTo.');
      return {'success': true, 'carrier': 'Skipped (Duplicate)'};
    }

    _appendLog(normalizedTo, message, 'processing', simSlot: activeSlot);
    final res = await SmsNativeService.sendSms(normalizedTo, message, simSlot: activeSlot);
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

  void _appendLog(String to, String message, String status, {int? simSlot}) {
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
        simSlot: simSlot ?? _preferredSimSlot,
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
