import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { initDb, pool } from "./db.js";
import clientRoutes from "./routes/clients.routes.js";
import serviceRoutes from "./routes/services.routes.js"
import petRoutes from "./routes/pets.routes.js";
import breedsRoutes from "./routes/breeds.routes.js";
import weightClassRoutes from "./routes/weightClasses.routes.js"
import serviceConfigurationRoutes from "./routes/serviceConfigurations.routes.js"
import appointmentRoutes from "./routes/appointments.routes.js"
import stylistRoutes from "./routes/stylists.routes.js"
import stylistAvailabilityRoutes from "./routes/stylistAvailability.routes.js"
import stylistTimeOffRoutes from "./routes/stylistTimeOff.routes.js"
import userRoutes from "./routes/users.routes.js"
import authRoutes from "./routes/auth.routes.js"

import { errorHandler } from "./middleware/error.middleware.js";



dotenv.config();

export const app = express(); // export the app itself

const PORT = process.env.PORT || 3000;
const FE_PORT = process.env.FE_PORT || 5173;
const FE_ORIGIN = process.env.FE_ORIGIN || `http://localhost:${FE_PORT}`;
const isProduction = process.env.NODE_ENV === "production";
const PgStore = connectPgSimple(session);

app.set("trust proxy", 1);
app.use(cors({
  origin: FE_ORIGIN,
  credentials: true,
}));
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
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/clients", clientRoutes);
app.use("/services", serviceRoutes);
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

app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
