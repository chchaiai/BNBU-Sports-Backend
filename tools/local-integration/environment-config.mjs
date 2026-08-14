export function parseEnvironment(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/u)) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    values.set(line.slice(0, separator), line.slice(separator + 1));
  }
  return values;
}

export function validateLocalEnvironment(values) {
  const failures = [];
  const requireValue = (key) => {
    const value = values.get(key);
    if (!value) failures.push(`${key}:missing`);
    else if (value.includes("CHANGE_ME")) failures.push(`${key}:placeholder`);
  };
  const positiveInteger = (key) => {
    const value = Number(values.get(key));
    if (!Number.isInteger(value) || value <= 0) {
      failures.push(`${key}:not-positive-integer`);
      return null;
    }
    return value;
  };
  const localPort = (key, fallback) => {
    const raw = values.get(key) ?? String(fallback);
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 65_535) {
      failures.push(`${key}:not-valid-port`);
      return null;
    }
    return value;
  };
  const safeCliCredential = (key) => {
    const value = values.get(key);
    if (value && !/^[A-Za-z0-9]/u.test(value)) {
      failures.push(`${key}:unsafe-cli-prefix`);
    }
  };

  for (const key of [
    "DATABASE_URL",
    "MIGRATION_DATABASE_URL",
    "TOKEN_SIGNING_KEY",
    "TOKEN_VERIFYING_KEY",
    "IDEMPOTENCY_ENCRYPTION_KEY",
    "QR_JOIN_TOKEN_HASH_KEY",
    "QR_JOIN_SECRET_ENCRYPTION_KEY",
    "PUSH_TOKEN_ENCRYPTION_KEY",
    "OBJECT_STORAGE_ACCESS_KEY",
    "OBJECT_STORAGE_SECRET_KEY",
    "MEDIA_STORAGE_ACCESS_KEY",
    "MEDIA_STORAGE_SECRET_KEY",
    "MINIO_ROOT_USER",
    "MINIO_ROOT_PASSWORD",
    "LOCAL_SEED_TEACHER_PASSWORD",
    "LOCAL_SEED_ADMIN_PASSWORD",
  ]) {
    requireValue(key);
  }

  if (values.get("APP_ENV") !== "local") failures.push("APP_ENV:not-local");
  localPort("PORT", 3000);
  const postgresPort = localPort("POSTGRES_PORT", 5433);
  const minioApiPort = localPort("MINIO_API_PORT", 9000);
  localPort("MINIO_CONSOLE_PORT", 9001);
  const mailpitSmtpPort = localPort("MAILPIT_SMTP_PORT", 1025);
  localPort("MAILPIT_UI_PORT", 8025);

  for (const key of [
    "OBJECT_STORAGE_ACCESS_KEY",
    "OBJECT_STORAGE_SECRET_KEY",
    "MEDIA_STORAGE_ACCESS_KEY",
    "MEDIA_STORAGE_SECRET_KEY",
    "MINIO_ROOT_USER",
    "MINIO_ROOT_PASSWORD",
  ]) {
    safeCliCredential(key);
  }

  const corsOrigins = new Set((values.get("CORS_ALLOWLIST") ?? "").split(","));
  if (
    !corsOrigins.has("http://127.0.0.1:3001") ||
    !corsOrigins.has("http://localhost:3001")
  ) {
    failures.push("CORS_ALLOWLIST:not-web-origin");
  }

  for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"]) {
    const value = values.get(key) ?? "";
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      failures.push(`${key}:invalid-url`);
      continue;
    }
    if (
      !["postgres:", "postgresql:"].includes(parsed.protocol) ||
      !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
      parsed.pathname !== "/bnbu_sports" ||
      (postgresPort !== null && parsed.port !== String(postgresPort))
    ) {
      failures.push(`${key}:not-local-postgres`);
    }
  }
  for (const key of ["OBJECT_STORAGE_ENDPOINT", "MEDIA_STORAGE_ENDPOINT"]) {
    let parsed;
    try {
      parsed = new URL(values.get(key) ?? "");
    } catch {
      failures.push(`${key}:invalid-url`);
      continue;
    }
    if (
      parsed.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
      parsed.pathname !== "/" ||
      (minioApiPort !== null && parsed.port !== String(minioApiPort))
    ) {
      failures.push(`${key}:not-local-minio`);
    }
  }
  if (
    !["127.0.0.1", "localhost"].includes(values.get("SMTP_HOST")) ||
    (mailpitSmtpPort !== null && values.get("SMTP_PORT") !== String(mailpitSmtpPort))
  ) {
    failures.push("SMTP:not-local-mailpit");
  }

  const accessTtl = positiveInteger("ACCESS_TOKEN_TTL");
  const refreshIdleTtl = positiveInteger("REFRESH_TOKEN_IDLE_TTL");
  const refreshAbsoluteTtl = positiveInteger("REFRESH_TOKEN_ABSOLUTE_TTL");
  const idempotencyLease = positiveInteger("IDEMPOTENCY_LEASE");
  const idempotencyRetention = positiveInteger("IDEMPOTENCY_RETENTION");
  const courseInviteTtl = positiveInteger("COURSE_INVITE_TTL_SECONDS");
  const joinCapabilityTtl = positiveInteger("JOIN_CAPABILITY_TTL_SECONDS");
  const replayWindow = positiveInteger("QR_JOIN_SECRET_REPLAY_SECONDS");

  if (
    accessTtl !== null &&
    refreshIdleTtl !== null &&
    refreshAbsoluteTtl !== null &&
    !(accessTtl < refreshIdleTtl && refreshIdleTtl <= refreshAbsoluteTtl)
  ) {
    failures.push("TOKEN_TTL:invalid-order");
  }
  if (
    idempotencyLease !== null &&
    idempotencyRetention !== null &&
    !(idempotencyLease < idempotencyRetention)
  ) {
    failures.push("IDEMPOTENCY_TTL:invalid-order");
  }
  if (
    replayWindow !== null &&
    idempotencyRetention !== null &&
    !(replayWindow >= idempotencyRetention)
  ) {
    failures.push("QR_REPLAY:shorter-than-idempotency");
  }
  if (
    joinCapabilityTtl !== null &&
    courseInviteTtl !== null &&
    !(joinCapabilityTtl < courseInviteTtl)
  ) {
    failures.push("JOIN_CAPABILITY_TTL:not-shorter-than-course-invite");
  }

  return failures;
}
