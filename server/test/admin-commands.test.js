import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  escapeRegex,
  formatDuration,
  parseCommand,
  parseDuration,
} from '../src/utils/adminCommands.js';

describe('utils/adminCommands', () => {
  it('разбирает команду и аргументы', () => {
    assert.deepEqual(parseCommand('/users demo'), {
      command: '/users',
      args: ['demo'],
      rawArgs: 'demo',
    });

    assert.deepEqual(parseCommand('  /rename  demo@workspot.kz  Даниил Бугаев  '), {
      command: '/rename',
      args: ['demo@workspot.kz', 'Даниил', 'Бугаев'],
      rawArgs: 'demo@workspot.kz  Даниил Бугаев',
    });

    assert.equal(parseCommand('/help').command, '/help');
    assert.deepEqual(parseCommand('/HELP@My_message_portfolio_bot').args, []);
    assert.equal(parseCommand('/HELP@My_message_portfolio_bot').command, '/help');
    assert.equal(parseCommand('просто текст').command, '');
  });

  it('понимает длительность в минутах и часах', () => {
    assert.equal(parseDuration('30m'), 30);
    assert.equal(parseDuration('90'), 90);
    assert.equal(parseDuration('1h'), 60);
    assert.equal(parseDuration('2ч'), 120);
    assert.equal(parseDuration('1 час'), 60);
    assert.equal(parseDuration('2 hours'), 120);
    assert.equal(parseDuration('0'), null);
    assert.equal(parseDuration('abc'), null);
    assert.equal(parseDuration(''), null);
  });

  it('форматирует длительность для ответа', () => {
    assert.equal(formatDuration(30), '30 мин');
    assert.equal(formatDuration(60), '1 ч');
    assert.equal(formatDuration(90), '1 ч 30 мин');
    assert.equal(formatDuration(120), '2 ч');
  });

  it('экранирует спецсимволы регулярки', () => {
    assert.equal(escapeRegex('a.b*c?'), 'a\\.b\\*c\\?');
    assert.equal(escapeRegex('demo@workspot.kz'), 'demo@workspot\\.kz');
  });
});
