import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockRelease = vi.fn();

vi.mock("../../db.js", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(() => ({
      query: mockQuery,
      release: mockRelease
    }))
  }
}));

import { pool } from "../../db.js";
import { book, findById, cancel, reschedule } from "../appointments.model.js";

const FUTURE_START = "2099-01-01T15:00:00.000Z";
const availabilityRows = [
  {
    day_of_week: 1,
    start_time: "09:00:00",
    end_time: "17:00:00"
  },
  {
    day_of_week: 2,
    start_time: "09:00:00",
    end_time: "17:00:00"
  },
  {
    day_of_week: 3,
    start_time: "09:00:00",
    end_time: "17:00:00"
  },
  {
    day_of_week: 4,
    start_time: "09:00:00",
    end_time: "17:00:00"
  },
  {
    day_of_week: 5,
    start_time: "09:00:00",
    end_time: "17:00:00"
  }
];

const timeOffRows = [
  {
    stylist_id: 1,
    start_datetime: '2026-03-10 01:00:00.000 -0400',
    end_datetime: '2026-03-13 00:59:59.000 -0400',
    reason: 'Sick leave',
  },

  {
    stylist_id: 2,
    start_datetime: '2026-03-15 00:00:00.000 -0500',
    end_datetime: '2026-03-15 12:00:00.000 -0500',
    reason: 'Dentist appointment',
  },

  {
    stylist_id: 2,
    start_datetime: '2026-03-20 3:15:00.000 -0500',
    end_datetime: '2026-03-20 4:45:00.000 -0500',
    reason: 'Drop off kid',
  }
]

beforeEach(() => {
  vi.resetAllMocks();
  mockQuery.mockReset();
  mockRelease.mockReset();
});

describe("book()", () => {
  it("creates appointment successfully", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) // pet lock
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      }) // client snapshot
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      }) // config
      .mockResolvedValueOnce({
        rows: availabilityRows,
      })
      // .mockResolvedValueOnce({
      //   rows: timeOffRows,
      // })
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [{ id: 99, status: "booked" }] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    const result = await book({
      client_id: 1,
      pet_id: 1,
      service_configuration_id: 10,
      stylist_id: 2,
      start_time: FUTURE_START
    });

    expect(result).toEqual({ id: 99, status: "booked" });
    expect(mockRelease).toHaveBeenCalled();
  });

  // it("throws when stylist is not available", async () => {
  //   mockQuery
  //     .mockResolvedValueOnce() // BEGIN
  //     .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
  //     .mockResolvedValueOnce({ rows: [{ id: 2 }] })
  //     .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "Kai", last_name: "Li" }] })
  //     .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] })
  //     .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // overlap exists
  //     .mockResolvedValueOnce(); // ROLLBACK

  //   await expect(
  //     book({
  //       client_id: 1,
  //       pet_id: 1,
  //       service_configuration_id: 10,
  //       stylist_id: 2,
  //       start_time: FUTURE_START
  //     })
  //   ).rejects.toThrow("stylist is not available at that time");
  // });

  it("throws mapped FK error (23503)", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({ code: "23503" }) // insert
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("invalid client, pet, stylist, or service configuration");
  });

  it("maps Rachel buffer trigger error when scheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "Rachel Wang requires a 20 minute buffer between appointments"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("stylist is not available at that time");
  });

  it("maps stylist time off trigger error when scheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      })
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("stylist is not available at that time");
  });

  it("throws when start_time is in the past", async () => {
    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "2000-01-01T00:00:00.000Z"
      })
    ).rejects.toThrow("invalid start_time: cannot be in the past");

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("throws when appointment end time is earlier than stylist's available time", async () => {
    /*****appointment starts earlier than stylist's available window*****/
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) //pet
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) //stylist
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      }) //client
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      }) //service config
      .mockResolvedValueOnce({
        rows: [{ day_of_week: 4, start_time: "09:00:00", end_time: "17:00:00" }]
      }) //availability
      // .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] }) //timeoff
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow(
      "appointment start time is earlier than stylist 2's available window"
    );
  });

  it("throws when appointment end time is later than stylist's available time", async () => {
    /*****appointment ends later than stylist's available window*****/
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) //pet
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) //stylist
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      }) //client
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      }) //service config
      .mockResolvedValueOnce({
        rows: [{ day_of_week: 4, start_time: "09:00:00", end_time: "17:00:00" }]
      }) //availability
      // .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] }) //timeoff
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date(FUTURE_START).setHours(18, 0, 0)
      })
    ).rejects.toThrow(
      "appointment end time is later than stylist 2's available window"
    );
  });

  it(`throws when appointment time overlaps with stylist's time off`, async () => {
    let start = new Date('2026-03-15 09:00:00.000 -0500')

        mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) //pet
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) //stylist
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      }) //client
      .mockResolvedValueOnce({
        rows: [
          { id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }
        ]
      }) //service config
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: timeOffRows }) //timeoff
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: start,
      })
    ).rejects.toThrow(
      "appointment time overlaps with stylist 2's time off window"
    );
  })
});

describe("findById()", () => {
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findById(1);
    expect(result).toBeNull();
  });
});

describe("cancel()", () => {
  it("cancels appointment", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, status: "cancelled" }] });
    const result = await cancel(1);
    expect(result.status).toBe("cancelled");
  });

  it("throws if not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await expect(cancel(1)).rejects.toThrow("appointment not found");
  });
});

describe("reschedule()", () => {
  it("reschedules successfully", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }]
      }) // lock
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "booked" }] }) // update
      .mockResolvedValueOnce(); // COMMIT

    const result = await reschedule(1, FUTURE_START);
    expect(result).toEqual({ id: 1, status: "booked" });
  });

  it("throws when stylist overlap exists", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }]
      })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // overlap
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, FUTURE_START)).rejects.toThrow(
      "stylist is not available at that time"
    );
  });

  it("maps Rachel buffer trigger error when rescheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "Rachel Wang requires a 10 minute buffer between appointments"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, FUTURE_START)).rejects.toThrow(
      "stylist is not available at that time"
    );
  });

  it("maps stylist time off trigger error when rescheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, FUTURE_START)).rejects.toThrow(
      "stylist is not available at that time"
    );
  });

  it("throws when new start_time is in the past", async () => {
    await expect(reschedule(1, "2000-01-01T00:00:00.000Z")).rejects.toThrow(
      "invalid start_time: cannot be in the past"
    );

    expect(mockQuery).not.toHaveBeenCalled();
  });
});
