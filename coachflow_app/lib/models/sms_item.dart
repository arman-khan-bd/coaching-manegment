class SmsQueueItem {
  final String id;
  final String coachingCenterId;
  final String to;
  final String recipientName;
  final String message;
  final String status; // 'pending', 'sent', 'failed'
  final int simSlot;
  final String createdAt;
  final String? sentAt;

  SmsQueueItem({
    required this.id,
    required this.coachingCenterId,
    required this.to,
    required this.recipientName,
    required this.message,
    required this.status,
    this.simSlot = 1,
    required this.createdAt,
    this.sentAt,
  });

  factory SmsQueueItem.fromJson(Map<String, dynamic> json) {
    return SmsQueueItem(
      id: json['id']?.toString() ?? '',
      coachingCenterId: json['coachingCenterId']?.toString() ?? json['coaching_center_id']?.toString() ?? '',
      to: json['to']?.toString() ?? json['recipient_phone']?.toString() ?? '',
      recipientName: json['recipientName']?.toString() ?? json['recipient_name']?.toString() ?? 'প্রাপক',
      message: json['message']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      simSlot: json['simSlot'] is int ? json['simSlot'] : 1,
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString() ?? DateTime.now().toIso8601String(),
      sentAt: json['sentAt']?.toString() ?? json['sent_at']?.toString(),
    );
  }
}

class SmsLogItem {
  final String id;
  final String time;
  final String to;
  final String message;
  final String status; // 'sent', 'failed', 'processing'
  final int simSlot;

  SmsLogItem({
    required this.id,
    required this.time,
    required this.to,
    required this.message,
    required this.status,
    this.simSlot = 1,
  });
}

class SimCardInfo {
  final int slotIndex;
  final String carrierName;
  final int subscriptionId;
  final bool isFirstSim;

  SimCardInfo({
    required this.slotIndex,
    required this.carrierName,
    required this.subscriptionId,
    required this.isFirstSim,
  });

  factory SimCardInfo.fromMap(Map<dynamic, dynamic> map) {
    return SimCardInfo(
      slotIndex: map['slotIndex'] is int ? map['slotIndex'] : 0,
      carrierName: map['carrierName']?.toString() ?? 'Primary Carrier',
      subscriptionId: map['subscriptionId'] is int ? map['subscriptionId'] : 1,
      isFirstSim: map['isFirstSim'] == true,
    );
  }
}
