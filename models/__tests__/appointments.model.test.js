import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookedAppointments } from "./fixtures/appointmentFixtures.js";
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
import { book, findById, cancel, update } from "../appointments.model.js";

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
    start_datetime: "2026-03-10 01:00:00.000 -0400",
    end_datetime: "2026-03-13 00:59:59.000 -0400",
    reason: "Sick leave"
  },

  {
    stylist_id: 2,
    start_datetime: "2026-03-15 00:00:00.000 -0500",
    end_datetime: "2026-03-15 12:00:00.000 -0500",
    reason: "Dentist appointment"
  },

  {
    stylist_id: 2,
    start_datetime: "2026-03-20 3:15:00.000 -0500",
    end_datetime: "2026-03-20 4:45:00.000 -0500",
    reason: "Drop off kid"
  }
];

const bookedAppointments = [{}];

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
        rows: availabilityRows
      }) //availability
      .mockResolvedValueOnce({
        rows: timeOffRows
      }) //time offs
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
      .mockResolvedValueOnce({
        rows: availabilityRows
      }) //availability
      .mockResolvedValueOnce({
        rows: timeOffRows
      }) //time offs
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

  it("throws when pet is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [] }); //pets

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("pet not found");
  });

  it("throws when owner is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] });

    await expect(
      book({
        client_id: 2,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("pet does not belong to client");
  });

  it("throws when stylist is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("stylist not found");
  });

  it("throws when client is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("client not found");
  });

  it("throws when service configuration is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }]
      }) // client snapshot
      .mockResolvedValueOnce({
        rows: []
      }); // config

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START
      })
    ).rejects.toThrow("service configuration not found");
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
        rows: availabilityRows
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
        start_time: new Date("2028-03-06 05:00:00.000 -0500")
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
    let start = new Date("2026-03-15 09:00:00.000 -0500");

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
        start_time: start
      })
    ).rejects.toThrow(
      "appointment time overlaps with stylist 2's time off window"
    );
  });

  it("throws when appointment is over two days", async () => {
    const start = "2028-03-01 23:00:00.000 -500";
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
        rows: availabilityRows
      })
      .mockResolvedValueOnce({
        rows: timeOffRows
      })
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: start
      })
    ).rejects.toThrow("start time and end time must be on the same day");
    expect(mockRelease).toHaveBeenCalled();
  });
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

describe("update()", () => {
  const APPOINTMENT_ID = 1;
  const mockAppointment = {
    id: 1,
    client_id: 1,
    pet_id: 1,
    service_id: 35,
    stylist_id: 1,
    description: "test appointment",
    start_time: "2026-03-10 09:30:00.000 -0400",
    end_time: "2026-03-10 10:30:00.000 -0400",
    effective_end_time: "2026-03-10 10:50:00.000 -0400",
    status: "booked",
    price_snapshot: 30,
    duration_snapshot: 60,
    created_at: "2026-03-05 21:30:35.270 -0500"
  };

  it("throws when update is empty", async () => {
    await expect(update(1, {})).rejects.toThrow(
      "no fields provided for update"
    );
  });

  it("throws when client is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [] }); //client not exist

    await expect(
      update(APPOINTMENT_ID, {
        clientId: 99
      })
    ).rejects.toThrow("client not found");
  });

  it("throws when pet is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [] }); //pets

    await expect(
      update(APPOINTMENT_ID, {
        petId: 99
      })
    ).rejects.toThrow("pet not found");
  });

  it("throws when stylist is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [] }); //stylists

    await expect(
      update(APPOINTMENT_ID, {
        stylistId: 999
      })
    ).rejects.toThrow("stylist not found");
  });

  it("throws when serviceId is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [] }); //services

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999
      })
    ).rejects.toThrow("service not found");
  });

    it("throws when service configuration is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [{id : 999, name: 'test service'}] }) //service
      .mockResolvedValueOnce({ rows: [] }); //service configuration

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999,
        serviceConfigurationId: 999
      })
    ).rejects.toThrow("service configuration not found");
  });

   it("throws when start_time is in the past", async () => {
    await expect(
      update(APPOINTMENT_ID, {
        startTime: "2000-01-01T00:00:00.000Z"
      })
    ).rejects.toThrow("invalid start_time: cannot be in the past");

    expect(mockQuery).toHaveBeenCalled(2);
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
        rows: availabilityRows
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
        start_time: new Date("2028-03-06 05:00:00.000 -0500")
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
    let start = new Date("2026-03-15 09:00:00.000 -0500");

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
        start_time: start
      })
    ).rejects.toThrow(
      "appointment time overlaps with stylist 2's time off window"
    );
  });

  it("throws when appointment is over two days", async () => {
    const start = "2028-03-01 23:00:00.000 -500";
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
        rows: availabilityRows
      })
      .mockResolvedValueOnce({
        rows: timeOffRows
      })
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: start
      })
    ).rejects.toThrow("start time and end time must be on the same day");
    expect(mockRelease).toHaveBeenCalled();
  });


  it("updates successfully", async () => {
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
        rows: availabilityRows
      }) //availability
      // .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] }) //timeoff
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date("2028-03-06 05:00:00.000 -0500")
      })
    ).rejects.toThrow(
      "appointment start time is earlier than stylist 2's available window"
    );
  });
});
