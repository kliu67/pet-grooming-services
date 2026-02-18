import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock DB ----
vi.mock('../../db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from '../../db.js';

import {
  findOne,
  create,
  update,
  remove,
  getActiveConfig,
  findByService,
} from '../service_configuration.model.js';

beforeEach(() => {
  vi.clearAllMocks();
});

//
// FIND ONE
//
describe('findOne', () => {
  it('returns configuration when found', async () => {
    const mockRow = { price: 10 };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await findOne(1, 2, 3);

    expect(result).toEqual(mockRow);
  });

  it('returns null when not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await findOne(1, 2, 3);

    expect(result).toBeNull();
  });

  it('throws on invalid id', async () => {
    await expect(findOne(0, 1, 1)).rejects.toThrow('invalid species_id');
  });
});

//
// CREATE
//
describe('create', () => {
  it('creates and returns configuration', async () => {
    const mockRow = { price: 15 };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await create({
      species_id: 1,
      service_id: 2,
      weight_class_id: 3,
      price: 15,
      duration_minutes: 30,
    });

    expect(result).toEqual(mockRow);
    expect(pool.query).toHaveBeenCalled();
  });

  it('throws on duplicate configuration', async () => {
    pool.query.mockRejectedValue({ code: '23505' });

    await expect(create({
      species_id: 1,
      service_id: 2,
      weight_class_id: 3,
      price: 10,
      duration_minutes: 30,
    })).rejects.toThrow('configuration already exists');
  });

  it('throws on FK violation', async () => {
    pool.query.mockRejectedValue({ code: '23503' });

    await expect(create({
      species_id: 999,
      service_id: 2,
      weight_class_id: 3,
      price: 10,
      duration_minutes: 30,
    })).rejects.toThrow('invalid species, service, or weight class');
  });

  it('throws on invalid price', async () => {
    await expect(create({
      species_id: 1,
      service_id: 2,
      weight_class_id: 3,
      price: -1,
      duration_minutes: 30,
    })).rejects.toThrow('invalid price');
  });

  it('throws on invalid duration', async () => {
    await expect(create({
      species_id: 1,
      service_id: 2,
      weight_class_id: 3,
      price: 10,
      duration_minutes: 0,
    })).rejects.toThrow('invalid duration');
  });
});

//
// UPDATE
//
describe('update', () => {
  it('updates and returns configuration', async () => {
    const mockRow = { price: 20 };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await update(1, 2, 3, { price: 20 });

    expect(result).toEqual(mockRow);
  });

  it('throws if configuration not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(update(1, 2, 3, { price: 20 }))
      .rejects
      .toThrow('configuration not found');
  });

  it('throws on empty update', async () => {
    await expect(update(1, 2, 3, {}))
      .rejects
      .toThrow('no fields provided for update');
  });

  it('throws on invalid duration', async () => {
    await expect(update(1, 2, 3, { duration_minutes: 0 }))
      .rejects
      .toThrow('invalid duration');
  });
});

//
// REMOVE
//
describe('remove', () => {
  it('returns true when deleted', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const result = await remove(1, 2, 3);

    expect(result).toBe(true);
  });

  it('throws if configuration not found', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    await expect(remove(1, 2, 3))
      .rejects
      .toThrow('configuration not found');
  });
});

//
// GET ACTIVE CONFIG
//
describe('getActiveConfig', () => {
  it('returns config when active', async () => {
    const mockRow = { is_active: true };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await getActiveConfig(1, 2, 3);

    expect(result).toEqual(mockRow);
  });

  it('returns null when inactive', async () => {
    const mockRow = { is_active: false };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await getActiveConfig(1, 2, 3);

    expect(result).toBeNull();
  });
});

//
// FIND BY SERVICE
//
describe('findByService', () => {
  it('returns configurations for service', async () => {
    const mockRows = [{ service_id: 2 }];
    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await findByService(2);

    expect(result).toEqual(mockRows);
  });

  it('throws on invalid service id', async () => {
    await expect(findByService(0))
      .rejects
      .toThrow('invalid service_id');
  });
});

import { performance } from 'node:perf_hooks';

//
// CONCURRENCY TESTS
//
describe('concurrency', () => {

  it('handles many parallel reads safely', async () => {
    pool.query.mockResolvedValue({
      rows: [{ price: 10, duration_minutes: 30, is_active: true }]
    });

    const requests = Array.from({ length: 100 }, () =>
      findOne(1, 2, 3)
    );

    const results = await Promise.all(requests);

    expect(results.length).toBe(100);
    expect(pool.query).toHaveBeenCalledTimes(100);
  });


  it('handles parallel updates without crashing', async () => {
    pool.query.mockResolvedValue({
      rows: [{ price: 20 }]
    });

    const updates = Array.from({ length: 50 }, (_, i) =>
      update(1, 2, 3, { price: 10 + i })
    );

    const results = await Promise.all(updates);

    expect(results.length).toBe(50);
  });


  it('simulates race: create same config concurrently', async () => {
    let first = true;

    pool.query.mockImplementation(() => {
      if (first) {
        first = false;
        return Promise.resolve({ rows: [{ price: 10 }] });
      }
      return Promise.reject({ code: '23505' }); // duplicate
    });

    const tasks = [
      create({
        species_id: 1,
        service_id: 2,
        weight_class_id: 3,
        price: 10,
        duration_minutes: 30,
      }),
      create({
        species_id: 1,
        service_id: 2,
        weight_class_id: 3,
        price: 10,
        duration_minutes: 30,
      }),
    ];

    const results = await Promise.allSettled(tasks);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
  });

});


//
// SIMPLE PERFORMANCE TEST (logic only, mocked DB)
//
describe('performance', () => {

  it('processes 1000 lookups quickly (logic benchmark)', async () => {
    pool.query.mockResolvedValue({
      rows: [{ price: 10, duration_minutes: 30, is_active: true }]
    });

    const start = performance.now();

    const tasks = Array.from({ length: 1000 }, () =>
      getActiveConfig(1, 2, 3)
    );

    await Promise.all(tasks);

    const end = performance.now();
    const duration = end - start;

    // This is not DB speed — only JS logic overhead
    expect(duration).toBeLessThan(500); // should be very fast
  });

});