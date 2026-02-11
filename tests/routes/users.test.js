import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../index.js";
import { initDb, pool } from "../../db.js";

beforeAll(async () => {
  await initDb();

  // Clean table before tests
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  // Close DB connection
  await pool.end();
});

describe("GET /api/users", () => {
  it("should return an empty array initially", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/users", () => {
  it("should create a new user", async () => {
    const userItem = {
      full_name: 'test user',
      email: 'test@email.com',
      phone: '1234567890',
      description: 'test description'
    }
    const res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.full_name).toBe("test user");
  });

  it("should return 400 if user full name, phone, or email is empty", async () => {
    let userItem = {
      full_name: '',
      email: 'test@email.com',
      phone: '1234567890',
      description: 'test description'
    }
    let res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('full_name, phone, and email required');

    userItem = {
      full_name: 'test user',
      email: '',
      phone: '1234567890',
      description: 'test description'
    }

    res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('full_name, phone, and email required');
    userItem = {
      full_name: 'test user',
      email: 'test@email.com',
      phone: '',
      description: 'test description'
    }
    res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('full_name, phone, and email required');

  });
});


describe("GET /api/users after creation", () => {
  it("should return array with one user", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].full_name).toBe("test user");
  });
});

describe("PUT /api/users/id after creation", async () => {
  beforeAll(async () => {
    await initDb();
    await pool.query("DELETE FROM users");
    const userItem = {
      full_name: 'test user',
      email: 'test@email.com',
      phone: '1234567890',
      description: 'test description'
    }
    const res =
      await request(app).post("/api/users").send(userItem);

  });

  
  it('should return 400 if user is updated', async () => {
    let res = await request(app).get("/api/users");
    const id = res.body[0].id;
    const payload = {
      full_name: 'new name',
      email: 'newemail@email.com',
      phone: '0987654321',
      description: 'updated info'
    }

    res = await request(app).put(`/api/users/${id}`).send(payload);
    expect(res.status).toBe(201);

    const updatedUser = await pool.query(
      'SELECT * from Users WHERE id=$1', [id]
    );
    expect(updatedUser.rows[0].full_name).toBe(payload.full_name);
    expect(updatedUser.rows[0].email).toBe(payload.email);
    expect(updatedUser.rows[0].phone).toBe(payload.phone);
    expect (updatedUser.rows[0].description).toBe(payload.description);


    console.log(updatedUser);
  });

});
describe("DELETE user", () => {

})
