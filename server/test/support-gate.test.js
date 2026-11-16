import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateSupportGate, formatWaitLeft, SUPPORT_REPLY_WAIT_MS } from '../src/utils/supportGate.js';

const NOW = new Date('2026-11-16T10:00:00Z').getTime();
const minutesAgo = (minutes) => new Date(NOW - minutes * 60_000).toISOString();

describe('utils/supportGate', () => {
  it('пустая переписка — писать можно сразу', () => {
    const gate = evaluateSupportGate(null, NOW);
    assert.equal(gate.canSend, true);
    assert.equal(gate.waitingForReply, false);
    assert.equal(gate.retryAfterSeconds, 0);
  });

  it('после ответа поддержки писать можно сразу', () => {
    const gate = evaluateSupportGate({ direction: 'admin', createdAt: minutesAgo(0.1) }, NOW);
    assert.equal(gate.canSend, true);
    assert.equal(gate.retryAfterSeconds, 0);
  });

  it('ждём ответа: блокировка до 5 минут', () => {
    const gate = evaluateSupportGate({ direction: 'user', createdAt: minutesAgo(1) }, NOW);
    assert.equal(gate.canSend, false);
    assert.equal(gate.waitingForReply, true);
    assert.equal(gate.retryAfterSeconds, 240);
  });

  it('через 5 минут ожидания можно написать снова', () => {
    const gate = evaluateSupportGate(
      { direction: 'user', createdAt: minutesAgo(SUPPORT_REPLY_WAIT_MS / 60_000) },
      NOW,
    );
    assert.equal(gate.canSend, true);
    assert.equal(gate.waitingForReply, false);
  });

  it('на границе 4 мин 59 с — ещё блокирует', () => {
    const gate = evaluateSupportGate({ direction: 'user', createdAt: minutesAgo(4.98) }, NOW);
    assert.equal(gate.canSend, false);
    assert.ok(gate.retryAfterSeconds >= 1 && gate.retryAfterSeconds <= 2);
  });

  it('форматирует остаток ожидания', () => {
    assert.equal(formatWaitLeft(278), '4 мин 38 с');
    assert.equal(formatWaitLeft(240), '4 мин');
    assert.equal(formatWaitLeft(45), '45 с');
  });
});
