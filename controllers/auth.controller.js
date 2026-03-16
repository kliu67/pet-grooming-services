import * as authService from "../services/auth.service.js";
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

export async function login(req, res){
  try{
    const {email, password } = req.body;
    const user = await authService.login(email, password);

    await regenerateSession(req);
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    await saveSession(req);

    res.json({ user });
  } catch (err) {
    res.status(401).json({
      error: err.message
    });
  }
}

export async function me(req, res) {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.sendStatus(401);
    }

    const user = await authService.getSessionUser(userId);

    if (!user) {
      return res.sendStatus(401);
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function logout(req, res) {
  try{
    if (!req.session) {
      return res.sendStatus(204);
    }

    await destroySession(req);
    res.clearCookie("sid");

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({error: err.message });
  }
}
