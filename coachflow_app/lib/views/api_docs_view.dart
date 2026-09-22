import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/sms_polling_service.dart';

class ApiDocsView extends StatelessWidget {
  const ApiDocsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = SmsPollingService();
    final baseUrl = service.apiBaseUrl;
    final cid = service.coachingCenterId;

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Card
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('⚡ REST API & Outbox Architecture', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                const Text(
                  'যেকোনো ওয়েবসাইট, ব্যাকএন্ড বা স্ক্রিপ্ট থেকে SMS পাঠাতে এই API ব্যবহার করুন। ফোন প্রতি ১০ সেকেন্ডে SIM 1 দিয়ে পাঠাবে।',
                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 12),
                _buildEndpointRow(
                  context,
                  label: '1. Phone Polling (GET):',
                  url: '$baseUrl/api/sms/$cid',
                  color: const Color(0xFF10B981),
                  desc: 'ফোন প্রতি ১০ সেকেন্ডে চেক করে পেন্ডিং মেসেজের তালিকা পায়।',
                ),
                const SizedBox(height: 10),
                _buildEndpointRow(
                  context,
                  label: '2. Enqueue SMS (POST):',
                  url: '$baseUrl/api/sms/$cid',
                  color: const Color(0xFF38BDF8),
                  desc: 'যেকোনো জায়গা থেকে SMS পাঠালে এই কিউতে জমা হয়।',
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // cURL Example Card
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('💻 cURL Request Example', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 16, color: Color(0xFF94A3B8)),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(
                          text: 'curl -X POST $baseUrl/api/sms/$cid \\\n'
                              '  -H "Content-Type: application/json" \\\n'
                              '  -d \'{\n'
                              '    "to": "+8801711456789",\n'
                              '    "message": "সম্মানিত অভিভাবক, উপস্থিতি নোটিশ।",\n'
                              '    "recipientName": "ফারহান শাকিল"\n'
                              '  }\'',
                        ));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('cURL কমান্ড কপি করা হয়েছে!')),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF020617),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Text(
                    'curl -X POST $baseUrl/api/sms/$cid \\\n'
                    '  -H "Content-Type: application/json" \\\n'
                    '  -d \'{\n'
                    '    "to": "+8801711456789",\n'
                    '    "message": "সম্মানিত অভিভাবক, উপস্থিতি নোটিশ।",\n'
                    '    "recipientName": "ফারহান শাকিল"\n'
                    '  }\'',
                    style: const TextStyle(
                      color: Color(0xFFA5F3FC),
                      fontSize: 11,
                      fontFamily: 'monospace',
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // How it Works Guide
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('💡 How It Works', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                SizedBox(height: 8),
                _BulletText('১. ওয়েব অ্যাডমিন ড্যাশবোর্ড থেকে ভর্তি, ফি বা অনুপস্থিতি নোটিশ পাঠালে এই API-তে কিউ জমা হয়।'),
                _BulletText('২. ফোনে চলা এই Flutter অ্যাপ প্রতি ১০ সেকেন্ডে ওই কোচিং সেন্টারের কিউ চেক করে।'),
                _BulletText('৩. পেন্ডিং SMS পেলে ফোনের নিজস্ব SIM 1 (GP/BL/Robi/Teletalk) দিয়ে সাথে সাথে পাঠিয়ে দেয়।'),
                _BulletText('৪. কোনো মেসেজ না থাকলে ফোন কিছুই পাঠায় না ("not get not send") এবং পরবর্তী ১০ সেকেন্ডের জন্য অপেক্ষা করে।'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEndpointRow(BuildContext context, {required String label, required String url, required Color color, required String desc}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF020617),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  url,
                  style: TextStyle(color: color, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.w600),
                ),
              ),
              InkWell(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: url));
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('URL কপি হয়েছে!')));
                },
                child: const Icon(Icons.copy, size: 14, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 2),
        Text(desc, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
      ],
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
}

class _BulletText extends StatelessWidget {
  final String text;
  const _BulletText(this.text, {Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), height: 1.4)),
    );
  }
}
