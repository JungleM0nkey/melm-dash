import { z } from 'zod';

// Incoming WebSocket message schema
export const wsMessageSchema = z.object({
  type: z.enum(['ping', 'subscribe', 'unsubscribe']),
  payload: z.unknown().optional(),
}).strict();

export type IncomingWsMessage = z.infer<typeof wsMessageSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safely parse and validate a WebSocket message
 */
export function validateWsMessage(raw: unknown): ValidationResult<IncomingWsMessage> {
  // First check if it's a string
  if (typeof raw !== 'string') {
    return { success: false, error: 'Message must be a string' };
  }

  // Check message size (max 1KB for incoming messages)
  if (raw.length > 1024) {
    return { success: false, error: 'Message too large' };
  }

  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, error: 'Invalid JSON' };
  }

  // Validate against schema
  const result = wsMessageSchema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      error: `Invalid message format: ${result.error.issues[0]?.message || 'unknown error'}`
    };
  }

  return { success: true, data: result.data };
}

/**
 * Sanitize string for logging (prevent log injection)
 */
export function sanitizeForLog(value: string, maxLength = 100): string {
  return value
    .slice(0, maxLength)
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '');
}
