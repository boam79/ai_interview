/**
 * Webhook Utilities
 * Handles sending data to make.com webhook
 */

const WEBHOOK_URL = 'https://hook.us2.make.com/97ph54bk97cl3o9y69curj5zfmmhfsli';

export interface PhoneSubmissionData {
  phoneNumber: string;
  timestamp: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Send phone number to make.com webhook
 * @param phoneNumber - User's phone number
 * @returns Promise<boolean> - Success status
 */
export async function sendPhoneNumberToWebhook(phoneNumber: string): Promise<boolean> {
  try {
    const data: PhoneSubmissionData = {
      phoneNumber,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      sessionId: generateSessionId(),
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('✅ Phone number sent to webhook successfully:', data);
      return true;
    } else {
      console.error('❌ Webhook request failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending phone number to webhook:', error);
    return false;
  }
}

/**
 * Generate a simple session ID
 * @returns string - Session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate webhook URL format
 * @param url - URL to validate
 * @returns boolean - Valid status
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && parsedUrl.hostname.includes('make.com');
  } catch {
    return false;
  }
}
