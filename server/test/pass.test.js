import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createPass, formatShortKey, verifyPass } from '../src/services/pass.service.js';

const USER_ID = '66f1c0a1b2c3d4e5f6a7b8c9';
const NOW = new Date('2026-11-16T10:00:00Z').getTime();

describe('services/pass', () => {
  it('выдаёт ключ из id пользователя и срока действия', () => {
    const pass = createPass(USER_ID, { now: NOW, ttlSeconds: 300 });

    assert.match(pass.token, /^WSP1\.[a-f0-9]{24}\.\d+\.[A-Za-z0-9_-]{24}$/);
    assert.equal(pass.expiresAt, NOW + 300_000);
    assert.equal(pass.ttlSeconds, 300);
    assert.match(pass.key, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(pass.key, formatShortKey(pass.token.split('.').at(-1)));
  });

  it('ключ действителен до истечения срока', () => {
    const pass = createPass(USER_ID, { now: NOW, ttlSeconds: 300 });
    const result = verifyPass(pass.token, { now: NOW + 60_000 });

    assert.equal(result.valid, true);
    assert.equal(result.userId, USER_ID);
    assert.equal(result.expiresAt, NOW + 300_000);
    assert.equal(result.reason, null);
  });

  it('после истечения ключ отклоняется', () => {
    const pass = createPass(USER_ID, { now: NOW, ttlSeconds: 60 });
    const result = verifyPass(pass.token, { now: NOW + 61_000 });

    assert.equal(result.valid, false);
    assert.equal(result.reason, 'EXPIRED');
    assert.equal(result.userId, USER_ID);
  });

  it('подделанный id или подпись не проходят', () => {
    const pass = createPass(USER_ID, { now: NOW, ttlSeconds: 300 });
    const [prefix, , expires, sig] = pass.token.split('.');

    const otherUser = verifyPass(`WSP1.aaaaaaaaaaaaaaaaaaaaaaaa.${expires}.${sig}`, { now: NOW });
    assert.equal(otherUser.valid, false);
    assert.equal(otherUser.reason, 'SIGNATURE');

    const otherTime = verifyPass(`${prefix}.${USER_ID}.${Number(expires) + 600}.${sig}`, {
      now: NOW,
    });
    assert.equal(otherTime.valid, false);
    assert.equal(otherTime.reason, 'SIGNATURE');
  });

  it('мусор и чужая версия формата отклоняются', () => {
    for (const token of ['', 'hello', 'WSP2.a.1.b', 'WSP1.a.b.c']) {
      const result = verifyPass(token, { now: NOW });
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'FORMAT');
    }
  });

  it('у разных пользователей разные ключи', () => {
    const first = createPass(USER_ID, { now: NOW });
    const second = createPass('507f1f77bcf86cd799439011', { now: NOW });

    assert.notEqual(first.token, second.token);
    assert.notEqual(first.key, second.key);
  });
});
