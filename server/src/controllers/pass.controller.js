import * as passService from '../services/pass.service.js';

/**
 * GET /api/pass — персональный QR-пропуск текущего пользователя.
 * Ключ подписан секретом сервера и действует ограниченное время,
 * поэтому клиент периодически запрашивает новый.
 */
export function get(req, res) {
  res.json(passService.createPass(req.auth.userId));
}
