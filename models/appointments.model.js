import { pool } from "../db.js";

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

async function assertStylistAvailable(
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
    throw new Error("stylist is not available at that time");
  }
}

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

export async function findAll () {
  const { rows } = await pool.query(
    `SELECT * FROM appointments ORDER BY id`
  )
  return rows ?? null;
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
    const config = await getActiveServiceConfiguration(dbClient, serviceConfigurationId);

    const end = new Date(start.getTime() + Number(config.duration_minutes) * 60000);

    await assertStylistAvailable(dbClient, stylistId, start, end);

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

export async function reschedule(id, newStartTime) {
  const numericId = validateId(id);
  const start = validateTime(newStartTime);

  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const apptRes = await dbClient.query(
      `SELECT * FROM appointments WHERE id = $1 FOR UPDATE`,
      [numericId]
    );

    if (!apptRes.rows[0]) {
      throw new Error("appointment not found");
    }

    const { duration_snapshot, stylist_id } = apptRes.rows[0];
    const end = new Date(start.getTime() + Number(duration_snapshot) * 60000);

    await assertStylistAvailable(dbClient, stylist_id, start, end, numericId);

    const updateRes = await dbClient.query(
      `
      UPDATE appointments
      SET start_time = $1,
          end_time = $2,
          status = 'booked'
      WHERE id = $3
      RETURNING *
      `,
      [start, end, numericId]
    );

    await dbClient.query("COMMIT");
    return updateRes.rows[0];
  } catch (err) {
    await dbClient.query("ROLLBACK");
    throw mapRescheduleDbError(err);
  } finally {
    dbClient.release();
  }
}
