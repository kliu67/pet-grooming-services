import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, initDb } from "./db.js";
import userRoutes from "./routes/users.routes.js";
import serviceRoutes from "./routes/services.routes.js"
import petRoutes from "./routes/pets.routes.js";
import speciesRoutes from "./routes/species.routes.js";
import weightClassRoutes from "./routes/weightClasses.routes.js"
import serviceConfigurationRoutes from "./routes/serviceConfigurations.routes.js"
import appointmentRoutes from "./routes/appointments.routes.js"

import { errorHandler } from "./middleware/error.middleware.js";



dotenv.config();

export const app = express(); // export the app itself

const PORT = process.env.PORT || 3000;
const FE_PORT = process.env.FEPORT || 5173;

app.use(cors({
  origin: `http://localhost:${FE_PORT}`, // your frontend
}));
app.use(express.json());
app.use(errorHandler);


// Initialize DB
// initDb().then(() => console.log("Postgres ready"));

if (process.env.NODE_ENV !== "test") {
  initDb().then(() => {
    app.listen(PORT, () => console.log("Postgres ready"));
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/services", serviceRoutes);
app.use("/pets", petRoutes);
app.use("/species", speciesRoutes);
app.use("/weightClasses", weightClassRoutes);
app.use("/serviceConfigurations", serviceConfigurationRoutes);
app.use("/appointments", appointmentRoutes);


