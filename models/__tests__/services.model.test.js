import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module
vi.mock('../../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock helpers
vi.mock('../../utils/helpers.js', () => ({
  isValidId: vi.fn(),
}));

// Import AFTER mocking
import { pool } from '../../db.js';
import { isValidId } from '../../utils/helpers.js';
import {
  findById,
  findAll,
  create,
  update,
  remove,
} from '../service.model.js';

beforeEach(() => {
  vi.clearAllMocks();
});

//read
describe('findById', () => {

  it('throws if id is not a number', async () => {
    await expect(findById('abc'))
      .rejects
      .toThrow('ID must be a number');
  });

  it('throws if id < 1', async () => {
    await expect(findById(0))
      .rejects
      .toThrow('must be greater than 0');
  });

  it('returns null if not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await findById(1);

    expect(result).toBeNull();
    expect(pool.query).toHaveBeenCalled();
  });

  it('returns row if found', async () => {
    const mockRow = { id: 1, name: 'Wash' };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await findById(1);

    expect(result).toEqual(mockRow);
  });

});

//create
describe('create', () => {

  it('throws if name is empty', async () => {
    await expect(create({ name: '', base_price: 10 }))
      .rejects
      .toThrow('data validation error');
  });

  it('throws if base_price is negative', async () => {
    await expect(create({ name: 'Wash', base_price: -1 }))
      .rejects
      .toThrow('base_price cannot be negative');
  });

  it('returns inserted row', async () => {
    const mockRow = { id: 1, name: 'Wash', base_price: 10 };

    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await create({ name: 'Wash', base_price: 10 });

    expect(result).toEqual(mockRow);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO services'),
      ['Wash', 10]
    );
  });

  it('handles unique violation error', async () => {
    pool.query.mockRejectedValue({
      code: '23505',
      details: 'Key (name) already exists',
    });

    await expect(create({ name: 'Wash', base_price: 10 }))
      .rejects
      .toThrow('already exists');
  });

});

//update
describe('update', () => {

  beforeEach(() => {
    isValidId.mockReturnValue(true);
  });

  it('throws if id invalid', async () => {
    isValidId.mockReturnValue(false);

    await expect(update(0, { name: 'Wash', base_price: 10 }))
      .rejects
      .toThrow('data validation error: id 0 is invalid');
  });

  it('throws if not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(update(1, { name: 'Wash', base_price: 10 }))
      .rejects
      .toThrow('not found');
  });

  it('returns updated row', async () => {
    const mockRow = { id: 1, name: 'Wash', base_price: 10 };

    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await update(1, { name: 'Wash', base_price: 10 });

    expect(result).toEqual(mockRow);
  });

});

//remove
describe('remove', () => {

  beforeEach(() => {
    isValidId.mockReturnValue(true);
  });

  it('throws if id invalid', async () => {
    isValidId.mockReturnValue(false);

    await expect(remove(0))
      .rejects
      .toThrow('ID is invalid');
  });

  it('throws if not found', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    await expect(remove(1))
      .rejects
      .toThrow('not found');
  });

  it('returns true if deleted', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const result = await remove(1);

    expect(result).toBe(true); 
  });

});
