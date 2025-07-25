const SENDCHAMP_API_KEY = import.meta.env.VITE_SENDCHAMP_API_KEY;
const SENDCHAMP_BASE_URL = 'https://api.sendchamp.com/api/v1';

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const smsService = {
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    try {
      const response = await fetch(`${SENDCHAMP_BASE_URL}/sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDCHAMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: message,
          sender_name: 'Schamp',
          route: 'dnd'
        }),
      });

      const data = await response.json();

      if (response.ok && data.code === 200) {
        return { success: true, message: 'SMS sent successfully' };
      } else {
        return { success: false, error: data.message || 'Failed to send SMS' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }
};