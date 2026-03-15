import * as authService from "../services/auth.service.js";

export async function login(req, res){
    try{
        const {email, password } = req.body;
        const {accessToken, refreshToken } = await authService.login(email, password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/auth/refresh"
        });

        res.json({ accessToken });
    } catch (err) {
        res.status(401).json({
            error: err.message
        });
    }
}