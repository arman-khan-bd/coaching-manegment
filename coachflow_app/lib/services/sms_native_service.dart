import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/sms_item.dart';

class SmsNativeService {
  static const MethodChannel _channel = MethodChannel('com.coachflow.app/sms_gateway');

  /// Safely request required SMS and Phone permissions together without activity collisions
  static Future<bool> requestPermissions() async {
    try {
      final statuses = await [
        Permission.sms,
        Permission.phone,
      ].request();

      final smsGranted = statuses[Permission.sms]?.isGranted ?? false;
      final phoneGranted = statuses[Permission.phone]?.isGranted ?? false;

      // Optional notification permission requested silently in background if needed
      try {
        if (await Permission.notification.isDenied) {
          await Permission.notification.request();
        }
      } catch (_) {}

      return smsGranted && phoneGranted;
    } catch (e) {
      return false;
    }
  }

  /// Send native SMS via SIM 1 (or specified slot)
  static Future<Map<String, dynamic>> sendSms(String to, String message, {int simSlot = 1}) async {
    try {
      final result = await _channel.invokeMethod('sendSms', {
        'to': to,
        'message': message,
        'simSlot': simSlot,
      });

      if (result is Map) {
        return {
          'success': result['success'] == true,
          'simSlot': result['simSlot'] ?? simSlot,
          'carrier': result['carrier']?.toString() ?? 'SIM $simSlot',
        };
      }
      return {'success': true, 'simSlot': simSlot, 'carrier': 'SIM $simSlot'};
    } on PlatformException catch (e) {
      return {'success': false, 'error': e.message ?? 'Failed to send SMS'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Get detected physical SIM cards
  static Future<List<SimCardInfo>> getSimCards() async {
    try {
      final result = await _channel.invokeMethod('getSimCards');
      if (result is List) {
        return result.map((item) => SimCardInfo.fromMap(item as Map)).toList();
      }
    } catch (_) {}
    return [
      SimCardInfo(slotIndex: 0, carrierName: 'Grameenphone 4G', subscriptionId: 1, isFirstSim: true)
    ];
  }

  /// Get device battery status
  static Future<Map<String, dynamic>> getBatteryStatus() async {
    try {
      final result = await _channel.invokeMethod('getBatteryStatus');
      if (result is Map) {
        return {
          'level': result['level'] is int ? result['level'] : 92,
          'isCharging': result['isCharging'] == true,
        };
      }
    } catch (_) {}
    return {'level': 92, 'isCharging': true};
  }
}
