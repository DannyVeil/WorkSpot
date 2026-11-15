import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const { user, tokens } = await authService.registerUser(req.body);
  res.status(201).json({ user, ...tokens });
}

export async function login(req, res) {
  const { user, tokens } = await authService.loginUser(req.body);
  res.json({ user, ...tokens });
}

export async function refresh(req, res) {
  const { user, tokens } = await authService.refreshSession(req.body.refreshToken);
  res.json({ user, ...tokens });
}

export async function logout(req, res) {
  await authService.logoutUser(req.body.refreshToken);
  res.json({ success: true });
}

export async function me(req, res) {
  const user = await authService.getUserById(req.auth.userId);
  res.json({ user });
}
