import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addDays,
  ceilToSlot,
  currentBusinessTime,
  defaultAvailabilityWindow,
  durationHours,
  fromMinutes,
  isSlotAligned,
  isValidDate,
  slotKeys,
  slotTime,
  toMinutes,
} from '../src/utils/time.js';

describe('utils/time', () => {
  it('переводит время в минуты и обратно', () => {
    assert.equal(toMinutes('00:00'), 0);
    assert.equal(toMinutes('09:30'), 570);
    assert.equal(toMinutes('23:59'), 1439);
    assert.equal(fromMinutes(570), '09:30');
    assert.equal(fromMinutes(0), '00:00');
  });

  it('проверяет существование даты', () => {
    assert.equal(isValidDate('2026-11-16'), true);
    assert.equal(isValidDate('2024-02-29'), true);
    assert.equal(isValidDate('2026-02-29'), false);
    assert.equal(isValidDate('2026-13-01'), false);
    assert.equal(isValidDate('16.11.2026'), false);
    assert.equal(isValidDate(''), false);
  });

  it('проверяет кратность слотов 30 минутам', () => {
    assert.equal(isSlotAligned('09:00'), true);
    assert.equal(isSlotAligned('09:30'), true);
    assert.equal(isSlotAligned('09:15'), false);
  });

  it('строит ключи слотов для интервала', () => {
    assert.deepEqual(slotKeys('2026-11-16', '09:00', '10:00'), [
      '2026-11-16T09:00',
      '2026-11-16T09:30',
    ]);
    assert.equal(slotKeys('2026-11-16', '09:00', '16:00').length, 14);
    assert.equal(slotKeys('2026-11-16', '09:00', '09:00').length, 0);
    assert.equal(slotTime('2026-11-16T14:30'), '14:30');
  });

  it('считает длительность и цену за полчаса', () => {
    assert.equal(durationHours('09:00', '16:00'), 7);
    assert.equal(durationHours('09:30', '11:00'), 1.5);
    assert.equal(durationHours('23:00', '23:30'), 0.5);
  });

  it('округляет время вверх до слота', () => {
    assert.equal(ceilToSlot('09:00'), '09:00');
    assert.equal(ceilToSlot('09:01'), '09:30');
    assert.equal(ceilToSlot('09:29'), '09:30');
    assert.equal(ceilToSlot('09:31'), '10:00');
    assert.equal(ceilToSlot('23:45'), '23:59');
  });

  it('прибавляет дни без ошибок на границе месяца и года', () => {
    assert.equal(addDays('2026-11-30', 1), '2026-12-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-01-01', -1), '2025-12-31');
    assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  });

  it('возвращает корректное окно доступности по умолчанию', () => {
    const timezone = 'Asia/Almaty';
    const now = currentBusinessTime(timezone);
    const window = defaultAvailabilityWindow(timezone);

    assert.match(window.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(window.startTime, /^([01]\d|2[0-3]):[0-5]\d$/);
    assert.match(window.endTime, /^([01]\d|2[0-3]):[0-5]\d$/);
    assert.ok(toMinutes(window.endTime) > toMinutes(window.startTime));
    assert.ok(window.date >= now.date);
  });
});
