import { ApiError } from '../utils/ApiError.js';
import { getAvailability, getSpaceBySlug } from '../services/availability.service.js';

/** GET /api/spaces?date=&startTime=&endTime=&type= */
export async function listSpaces(req, res) {
  const { date, startTime, endTime, type } = req.validatedQuery;
  const result = await getAvailability({
    date,
    startTime,
    endTime,
    type,
    userId: req.auth?.userId,
  });
  res.json(result);
}

/** GET /api/spaces/:slug */
export async function getSpace(req, res) {
  const space = await getSpaceBySlug(req.params.slug);
  res.json({ space });
}

/** GET /api/spaces/:slug/availability?date=&startTime=&endTime= */
export async function getSpaceAvailability(req, res) {
  const { date, startTime, endTime } = req.validatedQuery;
  const { spaces, window } = await getAvailability({
    date,
    startTime,
    endTime,
    userId: req.auth?.userId,
  });

  const space = spaces.find((item) => item.id === req.params.slug);
  if (!space) throw ApiError.notFound('Рабочее место не найдено', 'SPACE_NOT_FOUND');

  res.json({ window, space });
}
