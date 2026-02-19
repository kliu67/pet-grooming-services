import { describe, it, expect, vi, beforeEach } from 'vitest';

//
// Mock DB client + pool
//
const mockQuery = vi.fn();
const mockRelease = vi.fn();

vi.mock('../../db.js', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(() => ({
      query: mockQuery,
      release: mockRelease,
    })),
  },
}));

import { pool } from '../../db.js';
import {
  book,
  findById,
  cancel,
  reschedule,
} from '../appointments.model.js';

beforeEach(() => {
  vi.clearAllMocks();
});

//
// BOOK SUCCESS
//
describe('book()', () => {
  it('creates appointment successfully', async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, species: 1, weight_class: 1 }] }) // pet lock
      .mockResolvedValueOnce({ rows: [{ price: 50, duration_minutes: 60 }] }) // config
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    const result = await book({
      user_id: 1,
      pet_id: 1,
      service_id: 1,
      start_time: new Date(),
    });

    expect(result).toEqual({ id: 99 });
    expect(mockQuery).toHaveBeenCalled();
  });

  it('throws overlap error (23P01)', async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, species: 1, weight_class: 1 }] })
      .mockResolvedValueOnce({ rows: [{ price: 50, duration_minutes: 60 }] })
      .mockRejectedValueOnce({ code: '23P01' }) // insert overlap
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        user_id: 1,
        pet_id: 1,
        service_id: 1,
        start_time: new Date(),
      })
    ).rejects.toThrow('appointment overlaps existing booking');
  });

  it('throws FK error (23503)', async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce({ code: '23503' }) // FK error
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        user_id: 999,
        pet_id: 1,
        service_id: 1,
        start_time: new Date(),
      })
    ).rejects.toThrow('invalid user, pet, or service');
  });
});

//
// FIND BY ID
//
describe('findById()', () => {
  it('returns appointment', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it('returns null when not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await findById(1);
    expect(result).toBeNull();
  });
});

//
// CANCEL
//
describe('cancel()', () => {
  it('cancels appointment', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, status: 'cancelled' }] });

    const result = await cancel(1);
    expect(result.status).toBe('cancelled');
  });

  it('throws if not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(cancel(1)).rejects.toThrow('appointment not found');
  });
});

//
// RESCHEDULE
//
describe('reschedule()', () => {
  it('reschedules successfully', async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ duration_snapshot: 60 }] }) // lock
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // update
      .mockResolvedValueOnce(); // COMMIT

    const result = await reschedule(1, new Date());
    expect(result).toEqual({ id: 1 });
  });

  it('throws overlap error', async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ duration_snapshot: 60 }] })
      .mockRejectedValueOnce({ code: '23P01' }) // overlap
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, new Date()))
      .rejects
      .toThrow('new time overlaps existing booking');
  });
});

//
// CONCURRENCY SIMULATION
//
describe('concurrency simulation', () => {
  it('handles parallel booking safely (race simulation)', async () => {
    let first = true;
    let insertCount = 0;

    mockQuery.mockImplementation(async (sql) => {
    //   if (first) {
    //     first = false;
    //     return Promise.resolve({ rows: [{ id: 1 }] });
    //   }
    //   return Promise.reject({ code: '23P01' });
     if (sql === 'BEGIN') return;
  if (sql === 'COMMIT') return;
  if (sql === 'ROLLBACK') return;

  if (sql.includes('FROM pets')) {
    return { rows: [{ id: 1, species: 1, weight_class: 1 }] };
  }

  if (sql.includes('FROM service_configurations')) {
    return { rows: [{ price: 10, duration_minutes: 30 }] };
  }

  if (sql.includes('INSERT INTO appointments')) {
    insertCount++;

    if (insertCount === 1) {
      return { rows: [{ id: 1 }] }; // first booking succeeds
    }

    throw { code: '23P01' }; // second booking overlaps
  }

  throw new Error('Unexpected query: ' + sql);
    });

    const attempts = [
      book({ user_id: 1, pet_id: 1, service_id: 1, start_time: new Date() }),
      book({ user_id: 1, pet_id: 1, service_id: 1, start_time: new Date() }),
    ];

    const results = await Promise.allSettled(attempts);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
  });

  it('handles many concurrent reads', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const tasks = Array.from({ length: 50 }, () => findById(1));
    const results = await Promise.all(tasks);

    expect(results.length).toBe(50);
  });
});