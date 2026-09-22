import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { SmsGatewayModule } = NativeModules;

export interface SimCardInfo {
  slotIndex: number; // 0 for SIM 1, 1 for SIM 2
  carrierName: string;
  displayName: string;
  subscriptionId: number;
  isFirstSim: boolean;
}

export interface BatteryStatus {
  level: number;
  isCharging: boolean;
}

export interface SendSmsResult {
  success: boolean;
  parts: number;
  simSlot: number;
  carrier: string;
  messageId: string;
  timestamp: string;
}

export const SmsGateway = {
  /**
   * Request all mandatory Android permissions for reading phone state and sending SMS
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ...(Platform.Version >= 33
          ? [PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS]
          : []),
      ]);

      const smsGranted =
        granted[PermissionsAndroid.PERMISSIONS.SEND_SMS] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const phoneStateGranted =
        granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return smsGranted && phoneStateGranted;
    } catch (err) {
      console.warn('Failed to request permissions:', err);
      return false;
    }
  },

  /**
   * Send an SMS using SIM 1 (First SIM on dual-SIM devices)
   */
  async sendSms(phoneNumber: string, message: string): Promise<SendSmsResult> {
    if (Platform.OS !== 'android' || !SmsGatewayModule) {
      // Development fallback mock
      console.log(`[Mock SMS Gateway] Sending via SIM 1 to ${phoneNumber}: "${message}"`);
      return {
        success: true,
        parts: Math.ceil(message.length / 70),
        simSlot: 1,
        carrier: 'Grameenphone (Simulated)',
        messageId: `sim1_msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }

    return await SmsGatewayModule.sendSms(phoneNumber, message);
  },

  /**
   * Query installed SIM cards and detect dual-SIM status
   */
  async getSimCards(): Promise<SimCardInfo[]> {
    if (Platform.OS !== 'android' || !SmsGatewayModule) {
      return [
        {
          slotIndex: 0,
          carrierName: 'Grameenphone (4G)',
          displayName: 'GP SIM 1 (Primary)',
          subscriptionId: 1,
          isFirstSim: true,
        },
        {
          slotIndex: 1,
          carrierName: 'Banglalink',
          displayName: 'BL SIM 2 (Secondary)',
          subscriptionId: 2,
          isFirstSim: false,
        },
      ];
    }

    try {
      return await SmsGatewayModule.getSimCards();
    } catch (e) {
      console.warn('Could not query SIM cards:', e);
      return [];
    }
  },

  /**
   * Read device battery level
   */
  async getBatteryStatus(): Promise<BatteryStatus> {
    if (Platform.OS !== 'android' || !SmsGatewayModule) {
      return { level: 92, isCharging: true };
    }

    try {
      return await SmsGatewayModule.getBatteryStatus();
    } catch (e) {
      return { level: 100, isCharging: false };
    }
  },

  /**
   * Start local embedded HTTP REST API on the device
   */
  async startHttpServer(
    port: number = 8080,
    apiKey: string = 'gw_apk_live_gp_9f82d02c81e9bca23'
  ): Promise<{ success: boolean; port: number; ipAddress: string }> {
    if (Platform.OS !== 'android' || !SmsGatewayModule) {
      return { success: true, port, ipAddress: '192.168.0.105' };
    }

    return await SmsGatewayModule.startLocalHttpServer(port, apiKey);
  },

  /**
   * Stop local embedded HTTP REST API
   */
  async stopHttpServer(): Promise<boolean> {
    if (Platform.OS !== 'android' || !SmsGatewayModule) {
      return true;
    }

    return await SmsGatewayModule.stopLocalHttpServer();
  },
};
