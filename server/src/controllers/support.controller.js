import * as supportService from '../services/support.service.js';

/**
 * GET /api/support/messages — переписка текущего пользователя с поддержкой
 * и состояние «можно ли отправить следующее сообщение».
 */
export async function list(req, res) {
  const [messages, state] = await Promise.all([
    supportService.listSupportMessages(req.auth.userId),
    supportService.getSupportState(req.auth.userId),
  ]);

  res.json({ messages, ...state });
}

/** POST /api/support/messages — новый вопрос; пересылается оператору в Telegram */
export async function send(req, res) {
  const result = await supportService.sendUserMessage(req.auth.userId, req.body.text);
  res.status(201).json(result);
}
