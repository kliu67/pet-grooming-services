import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
<<<<<<< HEAD
import pgSession from "connect-pg-simple";
import { pool, initDb } from "./db.js";
=======
import connectPgSimple from "connect-pg-simple";
import { initDb, pool } from "./db.js";
>>>>>>> 08bde42d39396a7bd834fbdf50ed97ab11ca932c
import clientRoutes from "./routes/clients.routes.js";
import serviceRoutes from "./routes/services.routes.js";
import petRoutes from "./routes/pets.routes.js";
import breedsRoutes from "./routes/breeds.routes.js";
import weightClassRoutes from "./routes/weightClasses.routes.js";
import serviceConfigurationRoutes from "./routes/serviceConfigurations.routes.js";
import appointmentRoutes from "./routes/appointments.routes.js";
import stylistRoutes from "./routes/stylists.routes.js";
import stylistAvailabilityRoutes from "./routes/stylistAvailability.routes.js";
import stylistTimeOffRoutes from "./routes/stylistTimeOff.routes.js";
import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

export const app = express(); // export the app itself

const PORT = process.env.PORT || 3000;
<<<<<<< HEAD
const FE_PORT = process.env.FEPORT || 5173;
const PgSession = pgSession(session);
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions", // default, optional
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in production https
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);
app.use(
  cors({
    origin: `http://localhost:${FE_PORT}`, // your frontend
    credentials: true,
  }),
=======
const FE_PORT = process.env.FE_PORT || 5173;
const defaultOrigin = `http://localhost:${FE_PORT}`;
const allowedOrigins = (
  process.env.FE_ORIGINS ||
  process.env.FE_ORIGIN ||
  defaultOrigin
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const PgStore = connectPgSimple(session);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
>>>>>>> 08bde42d39396a7bd834fbdf50ed97ab11ca932c
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

<<<<<<< HEAD
// Initialize DB
// initDb().then(() => console.log("Postgres ready"));

if (process.env.NODE_ENV !== "test") {
  initDb().then(() => {
    app.listen(PORT, () => console.log("Postgres ready"));
    app.listen(PORT, () =>
      console.log(`Backend running at http://localhost:${PORT}`),
    );
  });
=======

if (process.env.NODE_ENV !== "test") {
  initDb()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`Backend running at http://localhost:${PORT}`)
      );
    })
    .catch((err) => {
      console.error("Failed to start backend:", err);
      process.exit(1);
    });
>>>>>>> 08bde42d39396a7bd834fbdf50ed97ab11ca932c
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/clients", clientRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/breeds", breedsRoutes);
app.use("/api/weightClasses", weightClassRoutes);
app.use("/api/serviceConfigurations", serviceConfigurationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/stylists", stylistRoutes);
app.use("/api/availability", stylistAvailabilityRoutes);
app.use("/api/timeOffs", stylistTimeOffRoutes);
app.use("/api/users", userRoutes);
app.use("/auth", authRoutes);

<<<<<<< HEAD
=======
app.use(errorHandler);

>>>>>>> 08bde42d39396a7bd834fbdf50ed97ab11ca932c
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

process.on("unhandledRejection", (err) =>
  console.error("Unhandled Rejection:", err),
);
process.on("uncaughtException", (err) =>
  console.error("Uncaught Exception:", err),
);
