import 'package:flutter/material.dart';
import '../models/sms_item.dart';
import '../services/sms_native_service.dart';
import '../services/sms_polling_service.dart';

class SmsGatewayView extends StatefulWidget {
  const SmsGatewayView({Key? key}) : super(key: key);

  @override
  State<SmsGatewayView> createState() => _SmsGatewayViewState();
}

class _SmsGatewayViewState extends State<SmsGatewayView> {
  final SmsPollingService _pollingService = SmsPollingService();

  late final TextEditingController _coachingIdController;
  late final TextEditingController _apiUrlController;
  final TextEditingController _testPhoneController = TextEditingController(text: '+880 1711-456789');
  final TextEditingController _testMsgController = TextEditingController(
    text: 'টেস্ট বার্তা: CoachFlow Flutter Android SMS Gateway SIM 1 সফলভাবে সংযুক্ত হয়েছে।',
  );

  List<SimCardInfo> _sims = [];
  int _batteryLevel = 94;
  bool _isCharging = true;
  bool _isSendingTest = false;

  @override
  void initState() {
    super.initState();
    _coachingIdController = TextEditingController(text: _pollingService.coachingCenterId);
    _apiUrlController = TextEditingController(text: _pollingService.apiBaseUrl);

    _pollingService.addListener(_onServiceUpdate);
    _loadTelephonyInfo();
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  Future<void> _loadTelephonyInfo() async {
    final sims = await SmsNativeService.getSimCards();
    final battery = await SmsNativeService.getBatteryStatus();
    if (mounted) {
      setState(() {
        _sims = sims;
        _batteryLevel = battery['level'] as int? ?? 94;
        _isCharging = battery['isCharging'] as bool? ?? true;
      });
    }
  }

  @override
  void dispose() {
    _pollingService.removeListener(_onServiceUpdate);
    _coachingIdController.dispose();
    _apiUrlController.dispose();
    _testPhoneController.dispose();
    _testMsgController.dispose();
    super.dispose();
  }

  Future<void> _handleSendTest() async {
    final phone = _testPhoneController.text.trim();
    final msg = _testMsgController.text.trim();
    if (phone.isEmpty || msg.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('মোবাইল নম্বর ও বার্তা লিখুন।')),
      );
      return;
    }

    setState(() => _isSendingTest = true);
    final res = await _pollingService.sendDirectTestSms(phone, msg);
    setState(() => _isSendingTest = false);

    if (mounted) {
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text('SIM 1 (${res['carrier'] ?? 'Primary'}) দিয়ে SMS সফলভাবে পাঠানো হয়েছে!'),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('SMS পাঠানো ব্যর্থ: ${res['error'] ?? ''}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sim1 = _sims.isNotEmpty ? _sims[0] : null;
    final dailyPercent = (_pollingService.dailySent / _pollingService.dailyLimit).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      body: RefreshIndicator(
        onRefresh: () async {
          await _loadTelephonyInfo();
          await _pollingService.executePollQueue();
        },
        color: const Color(0xFF6366F1),
        backgroundColor: const Color(0xFF0F172A),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 1. DUAL-SIM STATUS CARD
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '📱 Telephony & SIM Status',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF1E293B)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_isCharging ? '⚡ ' : '🔋 ', style: const TextStyle(fontSize: 11)),
                            Text('$_batteryLevel%', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'All SMS notifications are dispatched via SIM 1 (0 extra gateway fees).',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 12),

                  // SIM 1 Primary box
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.5)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF4F46E5),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('ACTIVE SENDER (SIM 1)', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                            const Text('📶 4G LTE Online', style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          sim1?.carrierName ?? 'Grameenphone 4G',
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Slot 0 • Subscription ID: ${sim1?.subscriptionId ?? 1} • Auto-prioritized',
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 2. 10-SECOND POLLING OUTBOX WORKER CARD
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: _pollingService.pollingActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _pollingService.pollingActive ? '১০-সেকেন্ড পোলিং সক্রিয়' : 'পোলিং বন্ধ',
                            style: TextStyle(
                              color: _pollingService.pollingActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF312E81),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF6366F1)),
                        ),
                        child: Text(
                          '⏱️ ${_pollingService.pollCountdown}s',
                          style: const TextStyle(color: Color(0xFFE0E7FF), fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '📡 10-Second SMS Outbox Queue',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'ওয়েব বা যেকোনো API থেকে আসা SMS এই ফোন প্রতি ১০ সেকেন্ডে চেক করে SIM 1 দিয়ে সেন্ড করে।',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 12),

                  // Coaching Center ID field
                  const Text('Coaching Center ID (লগইন আইডি):', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _coachingIdController,
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                    decoration: _inputDecoration('e.g. aac-dhaka-01'),
                    onChanged: (val) => _pollingService.setCoachingCenterId(val),
                  ),
                  const SizedBox(height: 10),

                  // Cloud API Base URL field
                  const Text('Server API URL:', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _apiUrlController,
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                    decoration: _inputDecoration('https://coaching-bd.netlify.app'),
                    onChanged: (val) => _pollingService.setApiBaseUrl(val),
                  ),
                  const SizedBox(height: 12),

                  // Status Container
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF020617),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('সর্বশেষ পোলিং অবস্থা:', style: TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          _pollingService.lastPollStatus,
                          style: const TextStyle(fontSize: 11, color: Color(0xFF38BDF8), fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'সময়: ${_pollingService.lastPollTime}',
                          style: const TextStyle(fontSize: 9, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _pollingService.isPolling ? null : () => _pollingService.executePollQueue(),
                          icon: _pollingService.isPolling
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.refresh, size: 16),
                          label: Text(_pollingService.isPolling ? 'পোলিং হচ্ছে...' : '🔄 এখনই পোল করুন'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4F46E5),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _pollingService.togglePolling(),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _pollingService.pollingActive ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                          side: BorderSide(color: _pollingService.pollingActive ? const Color(0xFFEF4444) : const Color(0xFF10B981)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(_pollingService.pollingActive ? 'পজ করুন' : 'চালু করুন'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 3. DAILY QUOTA PROGRESS CARD
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("📊 Today's SMS Quota (SIM 1)", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text(
                        '${_pollingService.dailySent} / ${_pollingService.dailyLimit}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: dailyPercent,
                      minHeight: 6,
                      backgroundColor: const Color(0xFF020617),
                      color: const Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Anti-spam safety protection active. Resets automatically at midnight.',
                    style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 4. MANUAL TEST SENDER CARD
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('✉️ Send Test SMS via SIM 1', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 8),
                  const Text('Recipient Phone:', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _testPhoneController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: _inputDecoration('+880 1711-xxxxxx'),
                  ),
                  const SizedBox(height: 8),
                  const Text('Message Content:', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _testMsgController,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: _inputDecoration('বার্তা লিখুন...'),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSendingTest ? null : _handleSendTest,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _isSendingTest
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('SIM 1 দিয়ে SMS পাঠান (৳0.00)', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 5. LIVE TRANSMISSION LOGS CARD
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('📋 Live Transmission Logs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text('${_pollingService.logs.length} records', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_pollingService.logs.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Center(
                        child: Text('কোনো লগ নেই', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                      ),
                    )
                  else
                    ..._pollingService.logs.map((log) => _buildLogItem(log)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogItem(SmsLogItem log) {
    Color statusColor;
    String statusText;

    if (log.status == 'sent') {
      statusColor = const Color(0xFF10B981);
      statusText = 'SENT (SIM 1)';
    } else if (log.status == 'failed') {
      statusColor = const Color(0xFFEF4444);
      statusText = 'FAILED';
    } else {
      statusColor = const Color(0xFFF59E0B);
      statusText = 'PROCESSING';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF020617),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(log.to, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(statusText, style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(log.message, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11)),
          const SizedBox(height: 3),
          Text(log.time, style: const TextStyle(color: Color(0xFF64748B), fontSize: 9)),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: child,
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      filled: true,
      fillColor: const Color(0xFF020617),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E293B))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E293B))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF6366F1))),
    );
  }
}
