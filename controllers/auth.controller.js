import * as authService from "../services/auth.service.js";

export function me(req, res) {
  if (!req.session?.user) return res.sendStatus(401);
    const expiresAt = req.session.cookie?.expires || null;
  res.json({ user: req.session.user,
    sessionExpiresAt: expiresAt
   });
}
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyCredentials(email, password);
    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      last_login_at: user.last_login_at
    };
    res.json({ user: req.session.user });
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
}
export function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid"); // default session cookie name
    res.sendStatus(204);
  });
}

export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const { accessToken, newRefreshToken } =
      await authService.refresh(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, // true in production https
      sameSite: "lax",
      path: "/auth/refresh",
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
