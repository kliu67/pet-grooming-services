export function authMiddleware(req, res, next) {
  if (!req.session?.user?.id) {
    return res.sendStatus(401);
  }

  req.user = req.session.user;
  next();
}


export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password required"
    });
  }

  next();
}
