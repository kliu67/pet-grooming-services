import { pool } from "../db.js";
import { parseTimeToMinutes, parseDateToMinutes } from "../utils/timeRanges.js";
import { areIntervalsOverlapping, add } from "date-fns";
import { computeBuffer } from "../utils/helpers.js";
function validateId(id, name = "id") {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`invalid ${name}`);
  }
  return n;
}

function validateUuid(uuid, name = "uuid") {
  if (typeof uuid !== "string") {
    throw new Error(`invalid ${name}`);
  }

  const trimmed = uuid.trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(trimmed)) {
    throw new Error(`invalid ${name}`);
  }

  return trimmed;
}

function validateTime(startTime) {
  const t = new Date(startTime);
  if (Number.isNaN(t.getTime())) {
    throw new Error("invalid start_time");
  }
  return t;
}

function assertStartTimeNotPast(start) {
  if (start.getTime() < Date.now()) {
    throw new Error("invalid start_time: cannot be in the past");
  }
}

function assertStartEndOnSameDay(start, end) {
  if (start.getDate() !== end.getDate()) {
    throw "start time and end time must be on the same day";
  }
  return true;
}

function assertStylistIsAvailable(availabilityData, stylistId, start, end) {
  // const dayOfWeek = start.getDay();
  const availableTime = availabilityData.rows.find(
    (a) => a.day_of_week === start.getDay()
  );
  if (availableTime) {
    //check stylist is available on this day of week
    const availabilityStartMinutes = parseTimeToMinutes(
      availableTime.start_time
    );
    const startMinutes = parseDateToMinutes(start);

    if (startMinutes < availabilityStartMinutes) {
      //check appointment time is equal to or later than the availabile start time
      throw `appointment start time is earlier than stylist ${stylistId}'s available window`;
    }

    const availabilityEndMinutes = parseTimeToMinutes(availableTime.end_time);
    const endMinutes = parseDateToMinutes(end);
    if (endMinutes > availabilityEndMinutes) {
      throw `appointment end time is later than stylist ${stylistId}'s available window`;
    }
    return true;
  }
  return false;
}

function assertNoTimeOffOverlap(timeOffData, stylistId, start, config) {
  const timeOffs = timeOffData.rows.filter(
    (to) => to.stylist_id === stylistId
  );

  if (!timeOffs || timeOffs.length === 0) {
    //no timeoffs found, skip check
    return true;
  }
  const overlaps = timeOffs.filter((to) => {
    const timeOffStart = new Date(to.start_datetime);
    const timeOffEnd = new Date(to.end_datetime);
    const appointmentStart = start;
    const appointmentEnd = add(appointmentStart, {
      minutes: config.duration_minutes
    });
    return areIntervalsOverlapping(
      { start: timeOffStart, end: timeOffEnd },
      { start: appointmentStart, end: appointmentEnd }
    );
  });

  if (overlaps[0]) {
    throw `appointment time overlaps with stylist ${stylistId}'s time off window`;
  }
  return true;
}

async function assertNoAppointmentOverlap(
  client,
  stylistId,
  start,
  end,
  excludeAppointmentId = null
) {
  const params = [stylistId, start, end];
  let excludeClause = "";

  if (excludeAppointmentId) {
    params.push(excludeAppointmentId);
    excludeClause = `AND id <> $${params.length}`;
  }

  const overlapRes = await client.query(
    `
    SELECT id
    FROM appointments
    WHERE stylist_id = $1
      AND status IN ('booked', 'confirmed')
      AND tstzrange(start_time, end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
      ${excludeClause}
    LIMIT 1
    `,
    params
  );

  if (overlapRes.rows[0]) {
    throw new Error("appointment overlaps with another appointment");
  }
}

// async function validateAppointmentTime(){
//   assertStartTimeNotPast
//   assertStartEndOnSameDay();
//   assertStylistIsAvailable();
//   assertNoTimeOffOverlap();
//   assertNoAppointmentOverlap();
// }

async function getClientSnapshot(client, clientId) {
  const userRes = await client.query(
    `
    SELECT id, first_name, last_name
    FROM users
    WHERE id = $1
    `,
    [clientId]
  );

  if (!userRes.rows[0]) {
    throw new Error("client not found");
  }

  const { first_name, last_name } = userRes.rows[0];
  return `${first_name} ${last_name}`.trim();
}

async function getClient(dbClient, clientId) {
  const userRes = await dbClient.query(
    `
    SELECT id, first_name, last_name
    FROM users
    WHERE id = $1
    `,
    [clientId]
  );

  if (!userRes.rows[0]) {
    throw new Error("client not found");
  }

  return userRes.rows[0];
}

async function getPet(dbClient, petId) {
  const petRes = await dbClient.query(
    `
    SELECT id, name, breed, owner, weigth_class_id
    FROM pets
    WHERE id = $1
    `,
    [petId]
  );

  if (!petRes.rows[0]) {
    throw new Error("pet not found");
  }

  return petRes.rows[0];
}

async function getStylist(dbClient, petId) {
  const stylistRes = await dbClient.query(
    `
      SELECT id, first_name, last_name, email, phone, is_active, uuid, created_at
      FROM stylists
      WHERE id = $1
      `,
    [petId]
  );

  if (!stylistRes.rows[0]) {
    throw new Error("stylist not found");
  }

  return stylistRes.rows[0];
}

async function getService(dbClient, serviceId) {
  const serviceRes = await dbClient.query(
    `SELECT id, name, base_price, description, uuid, created_at FROM services
        WHERE id = $1`,
    [serviceId]
  );

  if (!serviceRes.rows[0]) {
    throw new Error("service not found");
  }
  return serviceRes.rows[0] ?? null;
}

async function getActiveServiceConfiguration(client, serviceConfigurationId) {
  const cfgRes = await client.query(
    `
    SELECT sc.id, sc.price, sc.duration_minutes, s.name AS service_name
    FROM service_configurations sc
    JOIN services s ON s.id = sc.service_id
    WHERE sc.id = $1
      AND sc.is_active = TRUE
    `,
    [serviceConfigurationId]
  );

  if (!cfgRes.rows[0]) {
    throw new Error("service configuration not found");
  }

  return cfgRes.rows[0];
}

// async function getActiveServiceConfigurationByFKs(
//   client,
//   petId,
//   breedId,
//   serviceId
// ) {
//   const cfgRes = await client.query(
//     `
//      SELECT sc.id, sc.price, sc.duration_minutes, s.name AS service_name
//     FROM service_configurations sc
//     JOIN services s ON s.id = sc.service_id
//     WHERE sc.service_id = $1, sc.pet_id =
//       AND sc.is_active = TRUE
//     `
//   );
// }

function mapBookingDbError(err) {
  if (err.code === "23P01") {
    return new Error("appointment overlaps existing booking");
  }

  if (err.code === "23503") {
    return new Error("invalid client, pet, stylist, or service configuration");
  }

  if (
    err.code === "P0001" &&
    typeof err.message === "string" &&
    (err.message.includes("Rachel Wang requires") ||
      err.message.includes("appointment overlaps stylist time off"))
  ) {
    return new Error("stylist is not available at that time");
  }

  return err;
}

function mapRescheduleDbError(err) {
  if (err.code === "23P01") {
    return new Error("new time overlaps existing booking");
  }

  if (
    err.code === "P0001" &&
    typeof err.message === "string" &&
    (err.message.includes("Rachel Wang requires") ||
      err.message.includes("appointment overlaps stylist time off"))
  ) {
    return new Error("stylist is not available at that time");
  }

  return err;
}

function mapNotFoundError(err, entity) {
  if (err.code === "23503")
    throw new Error(`Invalid ${entity}: ${entity} not found in DB.`);
}

export async function findAll() {
  const { rows } = await pool.query(`SELECT * FROM appointments ORDER BY id`);
  return rows ?? null;
}

//TODO

export async function findByClientId(clientId) {
  const sanitizedId = validateId(clientId, "client id");
  const { rows } = await pool.query(`
    SELECT * FROM appointments
    WHERE client_id = $1
    ORDER BY start_time ASC
  `, [sanitizedId]);
  return rows ?? [];
}

export async function findByPetId(petId) {
  const sanitizedId = validateId(petId, "pet id");
  const { rows } = await pool.query(`
    SELECT * FROM appointments
    WHERE pet_id = $1
    ORDER BY start_time ASC
  `, [sanitizedId]);
  return rows ?? [];
}

export async function findByStylistId(stylistId) {
  const sanitizedId = validateId(stylistId, "stylist id");
  const { rows } = await pool.query(`
    SELECT * FROM appointments
    WHERE pet_id = $1
    ORDER BY stylist_id ASC
  `, [sanitizedId]);
  return rows ?? [];
}

export async function findByServiceId(serviceId) {
  const sanitizedId = validateId(serviceId, "service id");
  const { rows } = await pool.query(`
    SELECT * FROM appointments
    WHERE service_id = $1
    ORDER BY start_time ASC
  `, [sanitizedId]);
  return rows ?? [];
}

export async function book({
  client_id,
  pet_id,
  service_configuration_id,
  stylist_id,
  start_time,
  description = null
}) {
  const clientId = validateId(client_id, "client_id");
  const petId = validateId(pet_id, "pet_id");
  const serviceConfigurationId = validateId(
    service_configuration_id,
    "service_configuration_id"
  );
  const stylistId = validateId(stylist_id, "stylist_id");
  const start = validateTime(start_time);
  assertStartTimeNotPast(start);

  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const petRes = await dbClient.query(
      `
      SELECT id, owner
      FROM pets
      WHERE id = $1
      FOR UPDATE
      `,
      [petId]
    );

    if (!petRes.rows[0]) {
      throw new Error("pet not found");
    }

    if (petRes.rows[0].owner !== clientId) {
      throw new Error("pet does not belong to client");
    }

    const stylistRes = await dbClient.query(
      `SELECT id FROM stylists WHERE id = $1`,
      [stylistId]
    );

    if (!stylistRes.rows[0]) {
      throw new Error("stylist not found");
    }

    const clientNameSnapshot = await getClientSnapshot(dbClient, clientId);
    const config = await getActiveServiceConfiguration(
      dbClient,
      serviceConfigurationId
    );

    const end = new Date(
      start.getTime() + Number(config.duration_minutes) * 60000
    );
    //appointment start and end must be on the same day
    assertStartEndOnSameDay(start, end);

    const availabilityData = await dbClient.query(
      `SELECT day_of_week, start_time, end_time FROM stylist_availability WHERE stylist_id = $1`,
      [stylist_id]
    );

    if (!availabilityData.rows[0]) {
      throw `No availability data found for ${stylistId}`;
    }
    //stylist must have availability
    assertStylistIsAvailable(availabilityData, stylistId, start, end);

    const timeOffsData = await dbClient.query(
      `SELECT start_datettime, end_datettime FROM stylist_time_offs WHERE stylist_id = $1 AND end_datetime > NOW()`,
      [stylist_id]
    );

    //check for time off overlap if time off data exists
    if (timeOffsData.rows[0]) {
      assertNoTimeOffOverlap(timeOffsData, stylistId, start, config);
    }

    //appointment cannot overlap with another appointment
    await assertNoAppointmentOverlap(dbClient, stylistId, start, end);

    const insertRes = await dbClient.query(
      `
      INSERT INTO appointments
        (client_id, pet_id, service_configuration_id, stylist_id,
         client_name_snapshot, service_name_snapshot,
         start_time, end_time, price_snapshot, duration_snapshot, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        clientId,
        petId,
        serviceConfigurationId,
        stylistId,
        clientNameSnapshot,
        config.service_name,
        start,
        end,
        config.price,
        config.duration_minutes,
        description
      ]
    );

    await dbClient.query("COMMIT");
    return insertRes.rows[0];
  } catch (err) {
    await dbClient.query("ROLLBACK");
    throw mapBookingDbError(err);
  } finally {
    dbClient.release();
  }
}

export async function findById(id) {
  const numericId = validateId(id);

  const { rows } = await pool.query(
    `SELECT * FROM appointments WHERE id = $1`,
    [numericId]
  );

  return rows[0] ?? null;
}

export async function findByUuid(uuid) {
  const validUuid = validateUuid(uuid);

  const { rows } = await pool.query(
    `SELECT * FROM appointments WHERE uuid = $1`,
    [validUuid]
  );

  return rows[0] ?? null;
}

export async function cancel(id) {
  const numericId = validateId(id);

  const { rows } = await pool.query(
    `
    UPDATE appointments
    SET status = 'cancelled'
    WHERE id = $1
    RETURNING *
    `,
    [numericId]
  );

  if (!rows[0]) {
    throw new Error("appointment not found");
  }

  return rows[0];
}

// export async function reschedule(id, newStartTime) {
//   const numericId = validateId(id);
//   const start = validateTime(newStartTime);
//   assertStartTimeNotPast(start);

//   const dbClient = await pool.connect();

//   try {
//     await dbClient.query("BEGIN");

//     const apptRes = await dbClient.query(
//       `SELECT * FROM appointments WHERE id = $1 FOR UPDATE`,
//       [numericId]
//     );

//     if (!apptRes.rows[0]) {
//       throw new Error("appointment not found");
//     }

//     const { duration_snapshot, stylist_id } = apptRes.rows[0];
//     const end = new Date(start.getTime() + Number(duration_snapshot) * 60000);

//     assertStartEndOnSameDay(start, end);

//     const availabilityData = await dbClient.query(
//       `SELECT day_of_week, start_time, end_time FROM stylist_availability WHERE stylist_id = $1`,
//       [stylist_id]
//     );

//     if (!availabilityData.rows[0]) {
//       throw `No availability data found for ${stylistId}`;
//     }
//     //stylist must have availability
//     assertStylistIsAvailable(availabilityData, stylistId, start, end);

//     const timeOffsData = await dbClient.query(
//       `SELECT start_datettime, end_datettime FROM stylist_time_offs WHERE stylist_id = $1 AND end_datetime > NOW()`,
//       [stylist_id]
//     );

//     //check for time off overlap if time off data exists
//     if (timeOffsData.rows[0]) {
//       assertNoTimeOffOverlap(timeOffsData, stylistId, start, config);
//     }

//     //appointment cannot overlap with another appointment
//     await assertNoAppointmentOverlap(dbClient, stylistId, start, end);

//     await assertNoAppointmentOverlap(
//       dbClient,
//       stylist_id,
//       start,
//       end,
//       numericId
//     );

//   const updateRes = await dbClient.query(
//     `
//     UPDATE appointments
//     SET start_time = $1,
//         end_time = $2,
//         status = 'booked'
//     WHERE id = $3
//     RETURNING *
//     `,
//     [start, end, numericId]
//   );

//   await dbClient.query("COMMIT");
//   return updateRes.rows[0];
// } catch (err) {
//   await dbClient.query("ROLLBACK");
//   throw mapRescheduleDbError(err);
// } finally {
//   dbClient.release();
// }
// }

export async function update(id, updates) {
  const appId = validateId(id);

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("no fields provided for update");
  }

  const fields = [];
  const values = [];
  let index = 1;
  let client, pet, stylist, service;
  const { serviceConfigurationId } = updates;
  let appointment;
  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");
    appointment = await dbClient.query(
      "SELECT * FROM appointments WHERE id = $1",
      [appId]
    );
    if (!appointment) throw "appointment not found";
  } catch (err) {
    mapNotFoundError(err, "appointment");
  }

  //update client
  if ("clientId" in updates) {
    const clientId = validateId(updates.clientId);
    fields.push(`client_id = $${index++}`);
    values.push(clientId);

    client = await getClient(dbClient, clientId);
  }

  //update pet
  if ("petId" in updates) {
    const petId = validateId(updates.petId);
    fields.push(`pet_id = $${index++}`);
    values.push(petId);

    pet = await getPet(dbClient, petId);
    //check if there is pet overlap. DB should be able to handle
  }

  //update stylist
  if ("stylistId" in updates) {
    const stylistId = validateId(updates.stylistId);
    fields.push(`stylist_id = $${index++}`);
    values.push(stylistId);

    stylist = await getStylist(dbClient, stylistId);
    if (!stylist) {
      throw new Error("stylist not found");
    }
  }

  //update service
  if ("serviceId" in updates) {
    const serviceId = validateId(updates.serviceId);
    fields.push(`service_id = $${index++}`);
    values.push(serviceId);

    service = await getService(dbClient, serviceId);
    const newConfig = await getActiveServiceConfiguration(
      dbClient,
      serviceConfigurationId
    );

    if (newConfig.duration_minutes !== appointment.duration_snapshot) {
      const stylistId = appointment.rows[0].stylist_id;
      const start = validateTime(appointment.rows[0].start_time);

      //check if new appointment end time is valid;
      const end = new Date(
        start.getTime() + Number(newConfig.duration_minutes) * 60000
      );
      assertStartEndOnSameDay(start, end);

      //stylist must have availability
      const availabilityData = await dbClient.query(
        `SELECT day_of_week, start_time, end_time FROM stylist_availability WHERE stylist_id = $1`,
        [stylistId]
      );
      if (!availabilityData.rows[0]) {
        throw `No availability data found for ${stylistId}`;
      }

      assertStylistIsAvailable(availabilityData, stylistId, start, end);

      const timeOffsData = await dbClient.query(
        `SELECT start_datettime, end_datettime FROM stylist_time_offs WHERE stylist_id = $1 AND end_datetime > NOW()`,
        [stylistId]
      );

      //check for time off overlap if time off data exists
      if (timeOffsData.rows[0]) {
        assertNoTimeOffOverlap(timeOffsData, stylistId, start, newConfig);
      }

      //appointment cannot overlap with another appointment
      await assertNoAppointmentOverlap(client, stylistId, start, end);
    }
  }

  if ("startTime" in updates) {
    const start = validateTime(updates.startTime);
    assertStartTimeNotPast(start);

    fields.push(`service_id = $${index++}`);
    values.push(start);
    const stylistId = appointment.rows[0].stylist_id;
    const config = await getActiveServiceConfiguration(
      dbClient,
      serviceConfigurationId
    );

    const end = new Date(
      start.getTime() + Number(config.duration_minutes) * 60000
    );
    //appointment start and end must be on the same day
    assertStartEndOnSameDay(start, end);
    const availabilityData = await dbClient.query(
      `SELECT day_of_week, start_time, end_time FROM stylist_availability WHERE stylist_id = $1`,
      [stylistId]
    );
    if (!availabilityData.rows[0]) {
      throw `No availability data found for ${stylistId}`;
    }

    //stylist must have availability
    assertStylistIsAvailable(availabilityData, stylistId, start, end);

    const timeOffsData = await dbClient.query(
      `SELECT start_datettime, end_datettime FROM stylist_time_offs WHERE stylist_id = $1 AND end_datetime > NOW()`,
      [stylistId]
    );

    //check for time off overlap if time off data exists
    if (timeOffsData.rows[0]) {
      assertNoTimeOffOverlap(timeOffsData, stylistId, start, config);
    }

    //appointment cannot overlap with another appointment
    await assertNoAppointmentOverlap(dbClient, stylistId, start, end);
  }
  if ("status" in updates) {
    //TO DO: mutate status
  }

  try {
    const updateRes = await dbClient.query(
      `
      UPDATE appointments
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING *
      `,
      values
    );

    await dbClient.query("COMMIT");


    return updateRes.rows[0];
  } catch (err) {
    await dbClient.query("ROLLBACK");
    if (err.code === "23503") {
      throw new Error("invalid appointment");
    }
    throw mapRescheduleDbError(err);
  } finally {
    dbClient.release();
  }
} 