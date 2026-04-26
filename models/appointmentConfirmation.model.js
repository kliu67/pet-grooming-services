import { pool } from "../db.js";
import { validateNumericId } from "../validators/validator.js";

export async function findByAppointmentId(appointmentId) {
  const sanitizedAppointmentId = validateNumericId(appointmentId);

  const { rows } = await pool.query(
    `
    SELECT
      a.id AS appointment_id,
      a.appointment_number,
      a.uuid AS appointment_uuid,
      a.status,
      a.start_time,
      a.end_time,
      a.effective_end_time,
      a.price_snapshot,
      a.duration_snapshot,
      a.description AS appointment_description,
      a.created_at AS appointment_created_at,

      c.id AS client_id,
      c.first_name AS client_first_name,
      c.last_name AS client_last_name,
      c.email AS client_email,
      c.phone AS client_phone,

      p.id AS pet_id,
      p.name AS pet_name,
      p.species AS pet_species,
      p.uuid AS pet_uuid,
      p.breed AS breed_name,
      

      wc.id AS weight_class_id,
      wc.label AS weight_class_label,
      wc.code AS weight_class_code,
      jsonb_build_array(lower(wc.weight_range), upper(wc.weight_range)) AS weight_bounds,

      s.id AS service_id,
      s.name AS service_name,
      s.code AS service_code,
      s.base_price AS service_base_price,

      st.id AS stylist_id,
      st.first_name AS stylist_first_name,
      st.last_name AS stylist_last_name,
      st.email AS stylist_email,
      st.phone AS stylist_phone
    FROM appointments a
    LEFT JOIN clients c ON c.id = a.client_id
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN weight_classes wc ON wc.id = p.weight_class_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN stylists st ON st.id = a.stylist_id
    WHERE a.id = $1
    LIMIT 1
    `,
    [sanitizedAppointmentId],
  );

  return rows[0] ?? null;
}
