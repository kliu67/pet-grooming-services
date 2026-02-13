import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, initDb } from "./db.js";
import userRoutes from "./routes/users.routes.js"; // ✅
import serviceRoutes from "./routes/services.routes.js"


dotenv.config();

export const app = express(); // export the app itself

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
// initDb().then(() => console.log("Postgres ready"));

if (process.env.NODE_ENV !== "test") {
  initDb().then(() => {
    app.listen(PORT, () => console.log("Postgres ready"));
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));

  });
}

// -------- CRUD ROUTES --------

// Create
app.post("/api/items", async (req, res) => {
  const { name, description } = req.body;

  const result = await pool.query(
    "INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );

  res.json(result.rows[0]);
});


// Read all
app.get("/api/items", async (req, res) => {
  const result = await pool.query("SELECT * FROM items ORDER BY id DESC");
  res.json(result.rows);
});

// Read one
app.get("/api/items/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM items WHERE id = $1",
    [req.params.id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(result.rows[0]);
});

// Update
app.put("/api/items/:id", async (req, res) => {
  const { name, description } = req.body;

  const result = await pool.query(
    `
    UPDATE items
    SET name = $1, description = $2
    WHERE id = $3
    RETURNING *
    `,
    [name, description, req.params.id]
  );
  res.json(result.rows[0]);
});

// Delete
app.delete("/api/items/:id", async (req, res) => {
  await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
  res.json({ deleted: req.params.id });
});


app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// app.use("/api/users", itemRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/services", serviceRoutes);


