import nodemailer from "nodemailer";

function maskEmail(email) {
  if (!email) return null;
  const normalized = String(email).trim();
  const atIndex = normalized.indexOf("@");
  if (atIndex <= 0) return "***";

  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  const maskedLocal =
    local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

function maskFromAddress(from) {
  if (!from) return null;
  const match = String(from).match(/<([^>]+)>/);
  if (!match) return "***";
  return maskEmail(match[1]);
}

function formatWhen(value) {
  if (!value) return "TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(date);
}

function buildCustomerText({
  customerName,
  petName,
  serviceName,
  breedName,
  when,
  appointmentNumber,
}) {
  return [
    `Hi ${customerName},`,
    "",
    "Your appointment has been booked successfully.",
    `Appointment: ${appointmentNumber ?? "Pending ID"}`,
    `Pet: ${petName ?? "N/A"}`,
    `Breed: ${breedName ?? "N/A"}`,
    `Service: ${serviceName ?? "N/A"}`,
    `When: ${when}`,
  ].join("\n");
}

function buildInternalNotificationText({
  customerName,
  customerPhone,
  customerEmail,
  petName,
  serviceName,
  breedName,
  when,
  appointmentNumber,
}) {
  return [
    "New appointment booked.",
    "",
    `Appointment: ${appointmentNumber ?? "Pending ID"}`,
    `Customer: ${customerName || "N/A"}`,
    `Customer Phone: ${customerPhone || "N/A"}`,
    `Customer Email: ${customerEmail || "N/A"}`,
    `Pet: ${petName ?? "N/A"}`,
    `Breed: ${breedName ?? "N/A"}`,
    `Service: ${serviceName ?? "N/A"}`,
    `When: ${when}`,
  ].join("\n");
}

function isEmailInDomain(email, domain) {
  if (!email || !domain) return false;
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedDomain = String(domain).trim().toLowerCase();
  return normalizedEmail.endsWith(`@${normalizedDomain}`);
}

function getEmailConfig() {
  return {
    from: process.env.APPOINTMENT_EMAIL_FROM,
    gmailUser: process.env.GMAIL_USER,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    bookingNotificationEmail: process.env.BOOKING_NOTIFICATION_EMAIL,
    bookingNotificationDomain: process.env.BOOKING_NOTIFICATION_DOMAIN,
  };
}

export function getEmailConfigStatus() {
  const {
    from,
    gmailUser,
    gmailAppPassword,
    bookingNotificationEmail,
    bookingNotificationDomain,
  } = getEmailConfig();

  return {
    fromConfigured: Boolean(from),
    fromMasked: maskFromAddress(from),
    gmailUserConfigured: Boolean(gmailUser),
    gmailUserMasked: maskEmail(gmailUser),
    gmailAppPasswordConfigured: Boolean(gmailAppPassword),
    bookingNotificationEmailConfigured: Boolean(bookingNotificationEmail),
    bookingNotificationEmailMasked: maskEmail(bookingNotificationEmail),
    bookingNotificationDomainConfigured: Boolean(bookingNotificationDomain),
    bookingNotificationDomain: bookingNotificationDomain || null,
  };
}

function createTransporter({ gmailUser, gmailAppPassword }) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

export async function verifyEmailTransport() {
  const { from, gmailUser, gmailAppPassword } = getEmailConfig();

  if (!from || !gmailUser || !gmailAppPassword) {
    return {
      ok: false,
      reason: "not-configured",
      message:
        "Missing APPOINTMENT_EMAIL_FROM, GMAIL_USER, or GMAIL_APP_PASSWORD",
    };
  }

  const transporter = createTransporter({ gmailUser, gmailAppPassword });
  await transporter.verify();
  return { ok: true };
}

export async function sendAppointmentCreatedEmail({
  to,
  customerName,
  customerPhone,
  petName,
  startTime,
  appointmentNumber,
  serviceName,
  breedName,
}) {
  const {
    from,
    gmailUser,
    gmailAppPassword,
    bookingNotificationEmail,
    bookingNotificationDomain,
  } = getEmailConfig();

  if (!from || !gmailUser || !gmailAppPassword) {
    console.warn(
      "[email] Skipping send: set APPOINTMENT_EMAIL_FROM, GMAIL_USER, and GMAIL_APP_PASSWORD",
    );
    return { sent: false, reason: "not-configured" };
  }

  if (
    bookingNotificationEmail &&
    bookingNotificationDomain &&
    !isEmailInDomain(bookingNotificationEmail, bookingNotificationDomain)
  ) {
    console.warn(
      `[email] BOOKING_NOTIFICATION_EMAIL must use @${bookingNotificationDomain}`,
    );
    return { sent: false, reason: "invalid-notification-domain" };
  }

  if (!to && !bookingNotificationEmail) {
    return { sent: false, reason: "missing-recipient" };
  }

  const when = formatWhen(startTime);
  const transporter = createTransporter({ gmailUser, gmailAppPassword });

  if (to) {
    const customerSubject = appointmentNumber
      ? `Appointment booked (${appointmentNumber})`
      : "Appointment booked";
    const customerText = buildCustomerText({
      customerName,
      petName,
      serviceName,
      breedName,
      when,
      appointmentNumber,
    });

    await transporter.sendMail({
      from,
      to,
      subject: customerSubject,
      text: customerText,
    });
  }

  if (bookingNotificationEmail) {
    const internalSubject = appointmentNumber
      ? `New booking alert (${appointmentNumber})`
      : "New booking alert";
    const internalText = buildInternalNotificationText({
      customerName,
      customerPhone,
      customerEmail: to,
      petName,
      serviceName,
      breedName,
      when,
      appointmentNumber,
    });

    await transporter.sendMail({
      from,
      to: bookingNotificationEmail,
      subject: internalSubject,
      text: internalText,
    });
  }

  return { sent: true };
}
