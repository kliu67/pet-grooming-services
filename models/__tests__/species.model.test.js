import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock DB ----
vi.mock('../../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from '../../db.js';

import {
  findAll,
  findById,
  create,
  remove,
} from '../species.model.js';

beforeEach(() => {
  vi.clearAllMocks();
});

//
// FIND ALL
//
describe('findAll', () => {
  it('returns rows from DB', async () => {
    const mockRows = [{ id: 1, name: 'dog' }];
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
  it('returns species when found', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, name: 'dog' }] });

    const result = await findById(1);

    expect(result).toEqual({ id: 1, name: 'dog' });
  });

  it('returns null when not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await findById(1);

    expect(result).toBeNull();
  });

  it('throws if id invalid', async () => {
    await expect(findById(0)).rejects.toThrow('invalid id');
  });
});

//
// CREATE
//
describe('create', () => {
  it('throws if name invalid', async () => {
    await expect(create('')).rejects.toThrow('invalid species name');
  });

  it('inserts and returns row', async () => {
    const mockRow = { id: 1, name: 'dog' };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await create('dog');

    expect(result).toEqual(mockRow);
    expect(pool.query).toHaveBeenCalled();
  });

  it('handles duplicate species', async () => {
    pool.query.mockRejectedValue({ code: '23505' });

    await expect(create('dog')).rejects.toThrow('species already exists');
  });
});

//
// REMOVE
//
describe('remove', () => {
  it('throws if id invalid', async () => {
    await expect(remove(0)).rejects.toThrow('invalid id');
  });

  it('throws if species not found', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    await expect(remove(1)).rejects.toThrow('species not found');
  });

  it('returns true when deleted', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const result = await remove(1);

    expect(result).toBe(true);
  });

  it('throws if FK constraint prevents delete', async () => {
    pool.query.mockRejectedValue({ code: '23503' });

    await expect(remove(1)).rejects.toThrow('cannot delete species in use');
  });
});