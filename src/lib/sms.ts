const SENDCHAMP_API_KEY = import.meta.env.VITE_SENDCHAMP_API_KEY;
const SENDCHAMP_BASE_URL = 'https://api.sendchamp.com/api/v1';

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any; // For debugging
}

export const smsService = {
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    try {
      // Validate inputs
      if (!SENDCHAMP_API_KEY) {
        return { success: false, error: 'SendChamp API key is not configured' };
      }
      
      if (!phone || !message) {
        return { success: false, error: 'Phone number and message are required' };
      }

      // Format phone number (ensure it starts with country code)
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      const requestBody = {
        to: [formattedPhone], // SendChamp expects an array
        message: message,
        sender_name: 'SC-OTP', // Make sure this sender name is approved
        route: 'dnd'
      };

      console.log('Sending SMS request:', requestBody); // For debugging

      const response = await fetch(`${SENDCHAMP_BASE_URL}/sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDCHAMP_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('SendChamp response:', data); // For debugging

      if (response.ok && (data.code === 200 || data.status === 'success')) {
        return { success: true, message: 'SMS sent successfully' };
      } else {
        return { 
          success: false, 
          error: data.message || data.error || 'Failed to send SMS',
          details: data // Include full response for debugging
        };
      }
    } catch (error) {
      console.error('SMS Service Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred',
        details: error
      };
    }
  }
};
