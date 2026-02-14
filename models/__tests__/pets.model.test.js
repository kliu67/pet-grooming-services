import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock DB ----
vi.mock('../../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from '../../db.js';

import {
  findByOwner,
  findById,
  create,
  update,
  remove,
} from '../pets.model.js';

beforeEach(() => {
  vi.clearAllMocks();
});

//
// FIND BY OWNER
//
describe('findByOwner', () => {
  it('returns pets for owner', async () => {
    const mockRows = [{ id: 1, name: 'Buddy' }];
    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await findByOwner(1);

    expect(result).toEqual(mockRows);
    expect(pool.query).toHaveBeenCalled();
  });

  it('throws if owner id invalid', async () => {
    await expect(findByOwner(0)).rejects.toThrow('invalid id');
  });
});

//
// FIND BY ID
//
describe('findById', () => {
  it('returns pet when found', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await findById(1);

    expect(result).toEqual({ id: 1 });
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
    await expect(create({ name: '', species: 1, owner: 1 }))
      .rejects
      .toThrow('pet name cannot be empty');
  });

  it('throws if species invalid', async () => {
    await expect(create({ name: 'Buddy', species: 0, owner: 1 }))
      .rejects
      .toThrow('invalid id');
  });

  it('throws if owner invalid', async () => {
    await expect(create({ name: 'Buddy', species: 1, owner: 0 }))
      .rejects
      .toThrow('invalid id');
  });

  it('creates and returns row', async () => {
    const mockRow = { id: 1, name: 'Buddy' };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await create({
      name: 'Buddy',
      species: 1,
      owner: 1,
    });

    expect(result).toEqual(mockRow);
    expect(pool.query).toHaveBeenCalled();
  });

  it('handles FK violation', async () => {
    pool.query.mockRejectedValue({ code: '23503' });

    await expect(create({
      name: 'Buddy',
      species: 999,
      owner: 1,
    })).rejects.toThrow('invalid species or owner');
  });
});

//
// UPDATE
//
describe('update', () => {
  it('throws if id invalid', async () => {
    await expect(update(0, { name: 'Buddy' }))
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

    const result = await update(1, { name: 'Buddy' });

    expect(result).toEqual(mockRow);
  });

  it('throws if pet not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(update(1, { name: 'Buddy' }))
      .rejects
      .toThrow('pet not found');
  });

  it('handles invalid species FK', async () => {
    pool.query.mockRejectedValue({ code: '23503' });

    await expect(update(1, { species: 999 }))
      .rejects
      .toThrow('invalid species');
  });
});

//
// REMOVE
//
describe('remove', () => {
  it('throws if id invalid', async () => {
    await expect(remove(0)).rejects.toThrow('invalid id');
  });

  it('throws if pet not found', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    await expect(remove(1)).rejects.toThrow('pet not found');
  });

  it('returns true when deleted', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const result = await remove(1);

    expect(result).toBe(true);
  });
});