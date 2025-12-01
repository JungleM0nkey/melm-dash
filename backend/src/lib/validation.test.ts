import { describe, it, expect } from 'vitest';
import { validateWsMessage, sanitizeForLog } from './validation.js';

describe('validateWsMessage', () => {
  it('should accept valid ping message', () => {
    const result = validateWsMessage('{"type":"ping"}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ type: 'ping' });
  });

  it('should accept valid subscribe message', () => {
    const result = validateWsMessage('{"type":"subscribe"}');
    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('subscribe');
  });

  it('should reject non-string input', () => {
    const result = validateWsMessage(123);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Message must be a string');
  });

  it('should reject oversized messages', () => {
    const largeMessage = 'a'.repeat(2000);
    const result = validateWsMessage(largeMessage);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Message too large');
  });

  it('should reject invalid JSON', () => {
    const result = validateWsMessage('not valid json');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid JSON');
  });

  it('should reject unknown message types', () => {
    const result = validateWsMessage('{"type":"unknown"}');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid message format');
  });

  it('should reject messages with extra properties (strict mode)', () => {
    const result = validateWsMessage('{"type":"ping","extra":"field"}');
    expect(result.success).toBe(false);
  });

  it('should accept message with optional payload', () => {
    const result = validateWsMessage('{"type":"subscribe","payload":{"channel":"cpu"}}');
    expect(result.success).toBe(true);
    expect(result.data?.payload).toEqual({ channel: 'cpu' });
  });
});

describe('sanitizeForLog', () => {
  it('should truncate long strings', () => {
    const longString = 'a'.repeat(200);
    const result = sanitizeForLog(longString, 100);
    expect(result.length).toBe(100);
  });

  it('should remove newlines and tabs', () => {
    const result = sanitizeForLog('hello\nworld\ttab');
    expect(result).toBe('hello world tab');
  });

  it('should remove non-printable characters', () => {
    const result = sanitizeForLog('hello\x00world\x1F');
    expect(result).toBe('helloworld');
  });

  it('should preserve normal characters', () => {
    const result = sanitizeForLog('Hello World 123!');
    expect(result).toBe('Hello World 123!');
  });
});
