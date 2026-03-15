import * as authService from "../services/auth.service.js";

export async function login(req, res){
    try{
        const {email, password } = req.body;
        const {user, accessToken, refreshToken } = await authService.login(email, password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/auth/refresh"
        });

        res.json({ user, accessToken, refreshToken });
    } catch (err) {
        res.status(401).json({
            error: err.message
        });
    }
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
