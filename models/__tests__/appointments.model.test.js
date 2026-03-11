import { describe, it, expect, vi, beforeEach } from "vitest";
const mockQuery = vi.fn();
const mockRelease = vi.fn();

vi.mock("../../db.js", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(() => ({
      query: mockQuery,
      release: mockRelease,
    })),
  },
}));

import { pool } from "../../db.js";
import {
  book,
  findById,
  cancel,
  update,
  findAll,
  findByClientId,
  findByPetId,
  findByServiceId,
  findByStylistId,
} from "../appointments.model.js";

const FUTURE_START = "2099-01-01T15:00:00.000Z";
const NEAR_MIDNIGHT_START = "2028-03-01 23:00:00.000 -500";
const TIMEOFF_OVERLAP_START = "2026-03-15 09:00:00.000 -0500";

const availabilityRows = [
  {
    day_of_week: 1,
    start_time: "09:00:00",
    end_time: "17:00:00",
  },
  {
    day_of_week: 2,
    start_time: "09:00:00",
    end_time: "17:00:00",
  },
  {
    day_of_week: 3,
    start_time: "09:00:00",
    end_time: "17:00:00",
  },
  {
    day_of_week: 4,
    start_time: "09:00:00",
    end_time: "17:00:00",
  },
  {
    day_of_week: 5,
    start_time: "09:00:00",
    end_time: "17:00:00",
  },
];

const timeOffRows = [
  {
    stylist_id: 1,
    start_datetime: "2026-03-10 01:00:00.000 -0400",
    end_datetime: "2026-03-13 00:59:59.000 -0400",
    reason: "Sick leave",
  },

  {
    stylist_id: 2,
    start_datetime: "2026-03-15 00:00:00.000 -0500",
    end_datetime: "2026-03-15 12:00:00.000 -0500",
    reason: "Dentist appointment",
  },

  {
    stylist_id: 2,
    start_datetime: "2026-03-20 3:15:00.000 -0500",
    end_datetime: "2026-03-20 4:45:00.000 -0500",
    reason: "Drop off kid",
  },

  {
    stylist_id: 3,
    start_datetime: "2036-10-07 00:00:00.000 -0500",
    end_datetime: "2036-10-08 00:00:00.000 -0500",
    reason: "birthday",
  },
  {
    stylist_id: 3,
    start_datetime: "2036-07-01 00:00:00.000 -0500",
    end_datetime: "2036-07-02 00:00:00.000 -0500",
    reason: "Canada Day",
  },
  {
    stylist_id: 3,
    start_datetime: "2036-09-01 00:00:00.000 -0500",
    end_datetime: "2036-09-02 00:00:00.000 -0500",
    reason: "Labor Day",
  },
  {
    stylist_id: 3,
    start_datetime: "2036-04-11 00:00:00.000 -0500",
    end_datetime: "2036-04-12 00:00:00.000 -0500",
    reason: "Good Friday",
  },
];

const mockPet = {
  id: 1,
  name: "Lou",
  breed: 50,
  owner: 1,
  weight_class_id: 1,
};

const mockServiceConfiguration = {
  breed_id: 1,
  service_id: 1,
  weight_class_id: 1,
  price: 30,
  duration_minutes: 60,
  buffer_minutes: 20,
};

function mockCurrentAppointmentConfigLookup({
  pet = mockPet,
  config = mockServiceConfiguration,
} = {}) {
  mockQuery
    .mockResolvedValueOnce({ rows: [pet] })
    .mockResolvedValueOnce({ rows: [config] });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockQuery.mockReset();
  mockRelease.mockReset();
});

describe("findAll()", () => {
  it("returns appointments", async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });
    const result = await findAll();
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });
});
describe("findById()", () => {
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1 }],
    });
    const result = await findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findById(1);
    expect(result).toBeNull();
  });
});

describe("findByClientId()", () => {
  const appointments = [{ id: 1 }, { id: 2 }, { id: 3 }];
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({ rows: appointments });
    const result = await findByClientId(1);
    expect(result).toEqual(appointments);
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findByClientId(1);
    expect(result).toEqual([]);
  });
});

describe("findByPetId()", () => {
  const appointments = [{ id: 1 }, { id: 2 }, { id: 3 }];
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({ rows: appointments });
    const result = await findByPetId(1);
    expect(result).toEqual(appointments);
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findByPetId(1);
    expect(result).toEqual([]);
  });
});

describe("findByStylistId()", () => {
  const appointments = [{ id: 1 }, { id: 2 }, { id: 3 }];
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({ rows: appointments });
    const result = await findByStylistId(1);
    expect(result).toEqual(appointments);
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findByStylistId(1);
    expect(result).toEqual([]);
  });
});

describe("findByServiceId()", () => {
  const appointments = [{ id: 1 }, { id: 2 }, { id: 3 }];
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({ rows: appointments });
    const result = await findByServiceId(1);
    expect(result).toEqual(appointments);
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findByServiceId(1);
    expect(result).toEqual([]);
  });
});
describe("book()", () => {
  it("creates appointment successfully", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) // pet lock
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      }) // client snapshot
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] }) // service exists
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            price: 50,
            duration_minutes: 60,
            buffer_minutes: 20,
            service_name: "Bath",
          },
        ],
      }) // config
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: timeOffRows }) //time offs
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [{ id: 99, status: "booked" }] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    const result = await book({
      client_id: 1,
      pet_id: 1,
      service_id: 1,
      service_configuration_id: 10,
      stylist_id: 2,
      start_time: FUTURE_START,
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
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            price: 50,
            duration_minutes: 60,
            buffer_minutes: 20,
            service_name: "Bath",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: availabilityRows,
      }) //availability
      .mockResolvedValueOnce({
        rows: timeOffRows,
      }) //time offs
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({ code: "23503" }) // insert
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START,
      }),
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
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START,
      }),
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
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START,
      }),
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
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START,
      }),
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
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START,
      }),
    ).rejects.toThrow("client not found");
  });

  it("throws when service configuration is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      }) // client snapshot
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] }) // service exists
      .mockResolvedValueOnce({
        rows: [],
      }); // config

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: FUTURE_START,
      }),
    ).rejects.toThrow("service configuration not found");
  });

  it("throws when start_time is in the past", async () => {
    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "2000-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow(/cannot be in the past/);

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("throws when appointment end time is earlier than stylist's available time", async () => {
    /*****appointment starts earlier than stylist's available window*****/
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) //pet
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) //stylist
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      }) //client
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] }) //service
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            price: 50,
            duration_minutes: 60,
            buffer_minutes: 20,
            service_name: "Bath",
          },
        ],
      }) //service config
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date("2028-03-06 05:00:00.000 -0500"),
      }),
    ).rejects.toThrow(
      "appointment start time is earlier than stylist 2's available window",
    );
  });

  it("throws when appointment end time is later than stylist's available time", async () => {
    /*****appointment ends later than stylist's available window*****/
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) //pet
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) //stylist
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      }) //client
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] }) //service
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            price: 50,
            duration_minutes: 60,
            buffer_minutes: 20,
            service_name: "Bath",
          },
        ],
      }) //service config
      .mockResolvedValueOnce({
        rows: [
          { day_of_week: 4, start_time: "09:00:00", end_time: "17:00:00" },
        ],
      }) //availability
      // .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] }) //timeoff
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off",
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date(FUTURE_START).setHours(18, 0, 0),
      }),
    ).rejects.toThrow(
      "appointment end time is later than stylist 2's available window",
    );
  });

  it(`throws when appointment time overlaps with stylist's time off`, async () => {
    let start = new Date("2026-03-15 09:00:00.000 -0500");

    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) //pet
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) //stylist
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      }) //client
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] }) //service
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            price: 50,
            duration_minutes: 60,
            buffer_minutes: 20,
            service_name: "Bath",
          },
        ],
      }) //service config
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: timeOffRows }) //timeoff
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off",
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: start,
      }),
    ).rejects.toThrow(
      "appointment time overlaps with stylist 2's time off window",
    );
  });

  it("throws when appointment is over two days", async () => {
    const start = "2028-03-01 23:00:00.000 -500";
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) // pet lock
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({
        rows: [{ id: 1, first_name: "Kai", last_name: "Li" }],
      }) // client snapshot
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Bath" }] }) // service exists
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            price: 50,
            duration_minutes: 60,
            buffer_minutes: 20,
            service_name: "Bath",
          },
        ],
      }) // config
      .mockResolvedValueOnce({
        rows: availabilityRows,
      })
      .mockResolvedValueOnce({
        rows: timeOffRows,
      })
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: start,
      }),
    ).rejects.toThrow("start time and end time must be on the same day");
    expect(mockRelease).toHaveBeenCalled();
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
    stylist_id: 2,
    description: "test appointment",
    start_time: new Date("2028-03-10T09:30:00.000-05:00"),
    end_time: new Date("2028-03-10T10:30:00.000-05:00"),
    effective_end_time: new Date("2028-03-10T10:50:00.000-05:00"),
    status: "booked",
    price_snapshot: 30,
    duration_snapshot: 60,
    created_at: "2026-03-05 21:30:35.270 -0500",
  };

  const mockService = {
    id: 99,
    name: "test service",
  };

  it("Update throws when update is empty", async () => {
    await expect(update(1, {})).rejects.toThrow(
      "no fields provided for update",
    );
  });

  it("Update client - throws when client is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] }) // current pet lookup
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] }) // current config
      .mockResolvedValueOnce({ rows: [mockPet] }); // owner check

    await expect(
      update(APPOINTMENT_ID, {
        clientId: 99,
      }),
    ).rejects.toThrow("pet does not belong to client");
  });

  it("Update pet - throws when pet is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [] }); //pets

    await expect(
      update(APPOINTMENT_ID, {
        petId: 99,
      }),
    ).rejects.toThrow("pet not found");
  });

  it("Update stylist - throws when stylist is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: [] }); //stylists

    await expect(
      update(APPOINTMENT_ID, {
        stylistId: 999,
      }),
    ).rejects.toThrow("stylist not found");
  });

  it(" Update service - throws when serviceId is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: [] }); //services

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999,
      }),
    ).rejects.toThrow("service not found");
  });

  it("Update service - throws when service configuration is not found", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: [{ id: 999, name: "test service" }] }) //service
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [] }); //service configuration

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999,
      }),
    ).rejects.toThrow("service configuration not found");
  });

  it("Update service configuration - throws when appointment is over two days", async () => {
    const mockLongServiceConfiguration = {
      breed_id: 100,
      service_id: 99,
      weight_class_id: 4,
      price: 30,
      duration_minutes: 60 * 24,
      buffer_minutes: 20,
    };
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: [mockService] }) //service
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockLongServiceConfiguration] }) //service configuration
      .mockResolvedValueOnce(); // BEGIN

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999,
      }),
    ).rejects.toThrow("start time and end time must be on the same day");
  });

  it("Update service configuration - throws when new service duration exceeds stylist's available time", async () => {
    /*****appointment starts earlier than stylist's available window*****/
    const mockLongServiceConfiguration = {
      breed_id: 100,
      service_id: 99,
      weight_class_id: 4,
      price: 30,
      duration_minutes: 60 * 12,
      buffer_minutes: 20,
    };
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: [mockService] }) //service
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockLongServiceConfiguration] })
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999,
      }),
    ).rejects.toThrow(
      `appointment end time is later than stylist ${mockAppointment.stylist_id}'s available window`,
    );
  });

  it(`Update service configuration - throws when appointment time overlaps with stylist's time off`, async () => {
    const mockLongServiceConfiguration = {
      breed_id: 100,
      service_id: 99,
      weight_class_id: 4,
      price: 30,
      duration_minutes: 60 * 6,
      buffer_minutes: 20,
    };

    const additionalTimeOffRows = [
      ...timeOffRows,
      {
        stylist_id: 2,
        start_datetime: "2028-03-10 13:00:00.000 -0500",
        end_datetime: "2028-03-10 17:00:00.000 -0500",
        reason: "Emergency",
      },
    ];

    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: [mockService] }) //service
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockLongServiceConfiguration] })
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: additionalTimeOffRows })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update(APPOINTMENT_ID, {
        serviceId: 999,
      }),
    ).rejects.toThrow(
      `appointment time overlaps with stylist ${mockAppointment.stylist_id}'s time off window`,
    );
  });

  it("Update start time - throws when start_time is in the past", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] }) //pet
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce(); // ROLLBACK
    await expect(
      update(APPOINTMENT_ID, {
        startTime: "2000-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow(/cannot be in the past/);

    expect(mockQuery).toHaveBeenCalled(5);
  });

  it("Update start time - throws when appointment is over two days", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update(APPOINTMENT_ID, {
        startTime: NEAR_MIDNIGHT_START,
      }),
    ).rejects.toThrow("start time and end time must be on the same day");
  });

  it("Update start time - throws when appointment start time is earlier than stylist's available time", async () => {
    /*****appointment starts earlier than stylist's available window*****/
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update(APPOINTMENT_ID, {
        startTime: new Date("2028-03-06 05:00:00.000 -0500"),
      }),
    ).rejects.toThrow(
      `appointment start time is earlier than stylist ${mockAppointment.stylist_id}'s available window`,
    );
  });

  it("Update start time throws when appointment end time is later than stylist's available time", async () => {
    /*****appointment ends later than stylist's available window*****/
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update(APPOINTMENT_ID, {
        startTime: new Date("2028-03-06 16:50:00.000 -0500"),
      }),
    ).rejects.toThrow(
      `appointment end time is later than stylist ${mockAppointment.stylist_id}'s available window`,
    );
  });

  it(`Update start time throws when appointment time overlaps with stylist's time off`, async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: timeOffRows })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      update(APPOINTMENT_ID, {
        startTime: TIMEOFF_OVERLAP_START,
      }),
    ).rejects.toThrow(
      `appointment time overlaps with stylist ${mockAppointment.stylist_id}'s time off window`,
    );
  });

  it("Update successfully", async () => {
    const futureStart = "2036-10-06T15:00:00.000Z";
    const futureEnd = new Date(
      new Date(futureStart).getTime() +
        mockServiceConfiguration.duration_minutes * 60000,
    ).toISOString();
    const futureEffectiveEnd = new Date(
      new Date(futureStart).getTime() +
        (mockServiceConfiguration.duration_minutes +
          mockServiceConfiguration.buffer_minutes) *
          60000,
    ).toISOString();
    const mockUpdatedAppointment = {
      id: 2,
      client_id: 2,
      pet_id: 2,
      service_id: 40,
      stylist_id: 3,
      description: "updated test appointment",
      start_time: futureStart,
      end_time: futureEnd,
      effective_end_time: futureEffectiveEnd,
      status: "booked",
      price_snapshot: 30,
      duration_snapshot: 60,
      created_at: "2026-03-05 21:30:35.270 -0500",
    };
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [mockAppointment] }) //appointment
      .mockResolvedValueOnce({ rows: [mockPet] })
      .mockResolvedValueOnce({ rows: [mockServiceConfiguration] })
      .mockResolvedValueOnce({ rows: availabilityRows }) //availability
      .mockResolvedValueOnce({ rows: timeOffRows })
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [mockUpdatedAppointment] }) //return updated appointment
      .mockResolvedValueOnce(); // COMMIT

    const result = await update(APPOINTMENT_ID, { start_time: futureStart });
    expect(result).toEqual(mockUpdatedAppointment);
    expect(mockQuery).toHaveBeenCalled(8);
    expect(mockRelease).toHaveBeenCalled();
  });
});
