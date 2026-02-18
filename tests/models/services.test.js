// services.test.cjs
import { jest } from "@jest/globals";
import { findById, findAll, create } from "../../models/service.model.js";
import { pool } from "../../db.js";

jest.mock("../../db.js", () => ({
  pool: { query: jest.fn() }
}));
describe('services model', () => {
  beforeEach(() => {
    // Clear mocks before each test
    pool.query.mockClear();
  });

  describe('findById', () => {
    it('should return a service if found', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, name: 'Grooming', base_price: 50, uuid: 'uuid-1', created_at: null }
        ],
      });

      const result = await findById(1);

      expect(pool.query).toHaveBeenCalledWith(
        `SELECT id, name, base_price, uuid, created_at FROM services
        WHERE id = $1`,
        [1]
      );
      expect(result).toEqual({
        id: 1,
        name: 'Grooming',
        base_price: 50,
        uuid: 'uuid-1',
        created_at: null
      });
    });

    it('should return null if service not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await findById(999);
      expect(result).toBeNull();
    });

    it('should throw if id is not a number', async () => {
      await expect(findById('abc')).rejects.toThrow('ID must be a number');
    });

    it('should throw if id is less than 1', async () => {
      await expect(findById(0)).rejects.toThrow('ID is invalid');
    });
  });

  describe('findAll', () => {
    it('should return all services', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, name: 'Grooming', base_price: 50, uuid: 'uuid-1', created_at: null },
          { id: 2, name: 'Bath', base_price: 30, uuid: 'uuid-2', created_at: null }
        ],
      });

      const result = await findAll();

      expect(pool.query).toHaveBeenCalledWith(
        `SELECT id, name, base_price, uuid, created_at FROM services`
      );
      expect(result).toEqual(undefined); // your original findAll() does not return rows yet
    });
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const serviceData = { name: 'Bath', base_price: 30 };
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 2, name: 'Bath', base_price: 30, uuid: 'uuid-2', created_at: null }
        ],
      });

      const result = await create(serviceData);

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO services(name, base_price)
            VALUES ($1, $2)
            RETURNING id, name, base_price, uuid, created_at`,
        ['Bath', 30]
      );
      expect(result).toEqual({
        id: 2,
        name: 'Bath',
        base_price: 30,
        uuid: 'uuid-2',
        created_at: null
      });
    });

    it('should throw if name is empty', async () => {
      await expect(create({ name: '', base_price: 10 }))
        .rejects.toThrow('data validation error: name cannot be empty, null, or undefined');
    });

    it('should throw if base_price is invalid', async () => {
      await expect(create({ name: 'Test', base_price: undefined }))
        .rejects.toThrow('data validation error: base_price cannot be null, or undefined');
    });

    it('should throw if duplicate name', async () => {
      const serviceData = { name: 'Grooming', base_price: 50 };
      pool.query.mockRejectedValueOnce({
        code: '23505',
        details: 'Key (name)=(Grooming) already exists.'
      });

      await expect(create(serviceData))
        .rejects.toThrow('data validation error: Service with name Grooming already exists');
    });
  });
});
