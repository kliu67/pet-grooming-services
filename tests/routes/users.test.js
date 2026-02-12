import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../index.js";
import { initDb, pool } from "../../db.js";
import { v4 as uuidv4 } from "uuid"

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
  it("should return 201 if successfully created a new user", async () => {
    const userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description"
    };
    const res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.full_name).toBe("test user");
  });

  it("should return 400 if user full name, phone, or email is empty", async () => {
    let userItem = {
      full_name: "",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description"
    };
    let res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("full_name, phone, and email required");

    userItem = {
      full_name: "test user",
      email: "",
      phone: "1234567890",
      description: "test description"
    };

    res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("full_name, phone, and email required");
    userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: "",
      description: "test description"
    };
    res = await request(app).post("/api/users").send(userItem);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("full_name, phone, and email required");
  });
    it("should return 400 if user phone or email is invalid", async () => {
    //invalid email
      let userItem = {
        full_name: "test user",
        email: 12345,
        phone: "1234567890",
        description: "test description"
      };
      let res = await request(app).post("/api/users").send(userItem);
    expect(res.status).toBe(400);
    expect(res.error.text).toBe('{"error":"invalid email format"}');
    
    //invalid phone
    userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: 'abcde',
      description: "test description"
    };
    res = await request(app).post("/api/users").send(userItem);
    expect(res.status).toBe(400);
    expect(res.error.text).toBe('{"error":"invalid phone format"}');
  });

  it("should return 400 if body is empty", async() => {
    const userItem = {};
    const res = await request(app).post("/api/users").send(userItem);
    expect(res.status).toBe(400);
  });

  it("should return 409 if full_name, email, or phone already exists", async () => {
   const userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description"
    };
        
    await request(app).post("/api/users").send(userItem);

    //duplicate full_name
     let duplicateUserItem = {
      full_name: "test user",
      email: "unique@email.com",
      phone: "1231231234",
      description: "test description"
    };

    let res = await request(app).post("/api/users").send(duplicateUserItem);
     expect(res.status).toBe(409)
     expect(res.error.text).toBe("{\"error\":\"duplicate key value violates unique constraint \\\"users_full_name_key\\\"\"}");
    
     //duplicate email
      duplicateUserItem = {
      full_name: "user2",
      email: "test@email.com",
      phone: "1231231234",
      description: "test description"
      };

      res = await request(app).post("/api/users").send(duplicateUserItem);
     expect(res.status).toBe(409)
     expect(res.error.text).toBe("{\"error\":\"duplicate key value violates unique constraint \\\"users_email_key\\\"\"}");
    
     //duplicate phone
      duplicateUserItem = {
      full_name: "user2",
      email: "unique@email.com",
      phone: "1234567890",
      description: "test description"
      };

      res = await request(app).post("/api/users").send(duplicateUserItem);
     expect(res.status).toBe(409)
     expect(res.error.text).toBe("{\"error\":\"duplicate key value violates unique constraint \\\"users_phone_key\\\"\"}");
    

     
  });

});

describe("GET /api/users after creation", () => {
  beforeAll(async ()=>{
    await pool.query("DELETE FROM users");
     const userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description"
    };
    await request(app).post("/api/users").send(userItem);
  })
  it("should return array with one user", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].full_name).toBe("test user");
  });

  it("should return 200 if get by id is successful", async () => {
    let res = await request(app).get("/api/users");
    const _id = res.body[0].id;
     res = await request(app).get(`/api/users/${_id}`);
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      id: _id,
      full_name: "test user",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description",
      created_at: null,
    });
  });

  it("should return 404 if user not found", async () => {
    const id = uuidv4();
    const res = await request(app).get(`/api/users/${id}`);
    expect(res.status).toBe(404);
    expect(res.error.text).toBe("{\"error\":\"Not found\"}")
  });

  it("should return 404 for invalid UUID", async () => {
     const id = 'some-id';
    const res = await request(app).get(`/api/users/${id}`);
    expect(res.status).toBe(400);
    expect(res.error.text).toBe("{\"error\":\"id is not valid uuid\"}")
  });

  it("should return 500 if database fails", async () => {
  });
});



describe("PUT /api/users/id after creation", async () => {
  beforeAll(async () => {
    await initDb();
    await pool.query("DELETE FROM users");
    const userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description"
    };
    await request(app).post("/api/users").send(userItem);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users");
  });

  it("should return 400 if user is updated", async () => {
    let res = await request(app).get("/api/users");
    const id = res.body[0].id;
    const payload = {
      full_name: "new name",
      email: "newemail@email.com",
      phone: "0987654321",
      description: "updated info"
    };

    res = await request(app).put(`/api/users/${id}`).send(payload);
    expect(res.status).toBe(201);

    const updatedUser = await pool.query("SELECT * from Users WHERE id=$1", [
      id
    ]);
    expect(updatedUser.rows[0].full_name).toBe(payload.full_name);
    expect(updatedUser.rows[0].email).toBe(payload.email);
    expect(updatedUser.rows[0].phone).toBe(payload.phone);
    expect(updatedUser.rows[0].description).toBe(payload.description);
  });

  it("should return 404 if user does not exist", async () => {
    const id = uuidv4();
      const payload = {
      full_name: "new name",
      email: "newemail@email.com",
      phone: "0987654321",
      description: "updated info"
    };
     const res = await request(app).put(`/api/users/${id}`).send(payload);
     expect(res.status).toBe(404);
     expect(res.error.text).toBe("{\"error\":\"User not found\"}")

  });
  it("should return 400 for invalid UUID", async () => {
    const id = 'some-id';
     const payload = {
      full_name: "new name",
      email: "newemail@email.com",
      phone: "0987654321",
      description: "updated info"
    };
    const res = await request(app).put(`/api/users/${id}`).send(payload);
    expect(res.status).toBe(400);
    expect(res.error.text).toBe("{\"error\":\"id is not valid uuid\"}")
  });
  it("should return 400 for invalid input", async () => {
    let res = await request(app).get("/api/users");
    const id = res.body[0].id;
     let userItem = {
        full_name: "test user",
        email: 12345,
        phone: "1234567890",
        description: "test description"
      };
    res = await request(app).put(`/api/users/${id}`).send(userItem);
    expect(res.status).toBe(400);
    expect(res.error.text).toBe('{"error":"invalid email format"}');
    
    //invalid phone
    userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: 'abcde',
      description: "test description"
    };
    res = await request(app).put(`/api/users/${id}`).send(userItem);
    expect(res.status).toBe(400);
    expect(res.error.text).toBe('{"error":"invalid phone format"}');
  });

  it("should return 500 if database fails", async () => {});
});
describe("DELETE user", () => {
  beforeAll(async () => {
    await initDb();
    await pool.query("DELETE FROM users");
    const userItem = {
      full_name: "test user",
      email: "test@email.com",
      phone: "1234567890",
      description: "test description"
    };
    await request(app).post("/api/users").send(userItem);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users");
  });

  it("should return 404 if use not found", async () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const res = await request(app).delete(`/api/users/${id}`).send();
    expect(res.status).toBe(404);
  });

  it("should return 200 if delete successfully", async () => {
    const payload = {
      full_name: "delete user",
      email: "delete@email.com",
      phone: "0987654321",
      description: "delete"
    };

    let res = await pool.query(`
    INSERT INTO users (full_name, email, phone, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, phone ,description`, 
  [
    payload.full_name, payload.email, payload.phone, payload.description
  ]);

    console.log(res);
    const id = res?.rows[0]?.id;
    res = await request(app).delete(`/api/users/${id}`).send();
    expect(res.status).toBe(200);
  });

  it("should return 400 if request is invalid", async () => {
    const payload = {
      full_name: "delete user",
      email: "delete@email.com",
      phone: "0987654321",
      description: "delete"
    };

     let res = await pool.query(`
    INSERT INTO users (full_name, email, phone, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, phone ,description`, 
  [
    payload.full_name, payload.email, payload.phone, payload.description
  ]);

  console.log(res);
  const id = 'invalid id';
  res = await request(app).delete(`/api/users/${id}`).send();
  expect(res.status).toBe(400);
  expect(res.error.message).toBe('cannot DELETE /api/users/invalid%20id (400)')
   
   



  });
});
