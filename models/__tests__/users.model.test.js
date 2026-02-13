import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock DB ----
vi.mock('../../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// ---- Mock validators ----
vi.mock('../../validators/user.validator.js', () => ({
  isValidEmail: vi.fn(),
  isValidPhone: vi.fn(),
}));

vi.mock('../../validators/validator.js', () => ({
  isIdValidNumeric: vi.fn(),
  validateNumericId: vi.fn(),
}));

// ---- Import after mocks ----
import { pool } from '../../db.js';
import { isValidEmail, isValidPhone } from '../../validators/user.validator.js';
import { isIdValidNumeric, validateNumericId } from '../../validators/validator.js';

import {
  findAll,
  findById,
  create,
  update,
  remove,
} from '../user.model.js';

beforeEach(() => {
  vi.clearAllMocks();
});

//
// FIND ALL
//
describe('findAll', () => {
  it('returns all rows', async () => {
    const mockRows = [{ id: 1 }, { id: 2 }];
    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await findAll();

    expect(result).toEqual(mockRows);
    expect(pool.query).toHaveBeenCalled();
  });
});

//
// FIND BY ID
//
describe('findById', () => {
  it('returns user when found', async () => {
    validateNumericId.mockReturnValue(1);
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await findById(1);

    expect(result).toEqual({ id: 1 });
  });

  it('returns null when not found', async () => {
    validateNumericId.mockReturnValue(1);
    pool.query.mockResolvedValue({ rows: [] });

    const result = await findById(1);

    expect(result).toBeNull();
  });
});

//
// CREATE
//
describe('create', () => {
  beforeEach(() => {
    isValidPhone.mockReturnValue(true);
    isValidEmail.mockReturnValue(true);
  });

  it('throws if first/last name invalid', async () => {
    await expect(create({ first_name: '', last_name: '', phone: '123' }))
      .rejects
      .toThrow('first name and last name cannot be null or empty');
  });

  it('throws if phone invalid', async () => {
    isValidPhone.mockReturnValue(false);

    await expect(create({
      first_name: 'John',
      last_name: 'Doe',
      phone: 'bad'
    })).rejects.toThrow('invalid phone format');
  });

  it('throws if email invalid', async () => {
    isValidEmail.mockReturnValue(false);

    await expect(create({
      first_name: 'John',
      last_name: 'Doe',
      phone: '123456',
      email: 'bad'
    })).rejects.toThrow('invalid email format');
  });

  it('inserts and returns row', async () => {
    const mockRow = { id: 1 };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await create({
      first_name: 'John',
      last_name: 'Doe',
      phone: '123456',
      email: 'john@test.com'
    });

    expect(result).toEqual(mockRow);
    expect(pool.query).toHaveBeenCalled();
  });

  it('handles duplicate email', async () => {
    pool.query.mockRejectedValue({
      code: '23505',
      constraint: 'users_email_key',
    });

    await expect(create({
      first_name: 'John',
      last_name: 'Doe',
      phone: '123456',
      email: 'john@test.com'
    })).rejects.toThrow('email already exists');
  });

  it('handles duplicate phone', async () => {
    pool.query.mockRejectedValue({
      code: '23505',
      constraint: 'users_phone_key',
    });

    await expect(create({
      first_name: 'John',
      last_name: 'Doe',
      phone: '123456'
    })).rejects.toThrow('phone already exists');
  });
});

//
// UPDATE
//
describe('update', () => {
  beforeEach(() => {
    isIdValidNumeric.mockReturnValue(true);
    isValidEmail.mockReturnValue(true);
  });

  it('throws if id invalid', async () => {
    isIdValidNumeric.mockReturnValue(false);

    await expect(update(0, { first_name: 'John' }))
      .rejects
      .toThrow('invalid id');
  });

  it('throws if empty update', async () => {
    await expect(update(1, {}))
      .rejects
      .toThrow('no fields provided for update');
  });

  it('updates and returns row', async () => {
    const mockRow = { id: 1 };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await update(1, { first_name: 'John' });

    expect(result).toEqual(mockRow);
  });

  it('throws if user not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(update(1, { first_name: 'John' }))
      .rejects
      .toThrow('user not found');
  });

  it('handles duplicate email', async () => {
    pool.query.mockRejectedValue({
      code: '23505',
      constraint: 'users_email_key',
    });

    await expect(update(1, { email: 'a@test.com' }))
      .rejects
      .toThrow('email already exists');
  });
});

//
// REMOVE
//
describe('remove', () => {
  it('throws if id invalid', async () => {
    await expect(remove(0)).rejects.toThrow('invalid id');
  });

  it('throws if user not found', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    await expect(remove(1)).rejects.toThrow('user not found');
  });

  it('returns true when deleted', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const result = await remove(1);

    expect(result).toBe(true);
  });
});