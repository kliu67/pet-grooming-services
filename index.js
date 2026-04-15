import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool, initDb } from "./db.js";
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
import appointmentConfirmationRoutes from "./routes/appointmentConfirmation.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { verifyEmailTransport } from "./services/appointmentEmail.service.js";

dotenv.config();

export const app = express();

const PORT = process.env.PORT || 3000;
const FE_PORT = process.env.FEPORT || 5173;
const isProd = process.env.NODE_ENV === "production";
const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const envOrigins = [
  ...parseOrigins(process.env.FE_ORIGIN),
  ...parseOrigins(process.env.FE_ORIGINS),
];

const allowedOrigins =
  envOrigins.length > 0
    ? [...new Set(envOrigins)]
    : [`http://localhost:${FE_PORT}`];

if (isProd && envOrigins.length === 0) {
  throw new Error("FE_ORIGIN or FE_ORIGINS is required in production");
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const PgSession = connectPgSimple(session);
app.set("trust proxy", 1);

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Pet Grooming Services API",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health/email", async (req, res) => {
  try {
    const result = await verifyEmailTransport();
    if (!result.ok) {
      return res.status(503).json({
        status: "error",
        service: "email",
        reason: result.reason,
        message: result.message,
      });
    }

    return res.status(200).json({ status: "ok", service: "email" });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      service: "email",
      message: err.message,
    });
  }
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
app.use("/api/appointmentConfirmations", appointmentConfirmationRoutes);
app.use("/auth", authRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  initDb().then(() => {
    app.listen(PORT, () =>
      console.log(`Backend running at http://localhost:${PORT}`),
    );
  });
}

process.on("unhandledRejection", (err) =>
  console.error("Unhandled Rejection:", err),
);
process.on("uncaughtException", (err) =>
  console.error("Uncaught Exception:", err),
);
