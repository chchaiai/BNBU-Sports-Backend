import assert from "node:assert/strict";
import test from "node:test";

import {
  parseEnvironment,
  validateLocalEnvironment,
} from "./environment-config.mjs";

const validEnvironment = () =>
  parseEnvironment(`
APP_ENV=local
PORT=3000
POSTGRES_PORT=5433
DATABASE_URL=postgresql://bnbu_app:synthetic@127.0.0.1:5433/bnbu_sports?schema=public
MIGRATION_DATABASE_URL=postgresql://bnbu_migrator:synthetic@127.0.0.1:5433/bnbu_sports?schema=public
TOKEN_SIGNING_KEY=synthetic-private
TOKEN_VERIFYING_KEY=synthetic-public
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_IDLE_TTL=604800
REFRESH_TOKEN_ABSOLUTE_TTL=2592000
IDEMPOTENCY_RETENTION=86400
IDEMPOTENCY_LEASE=30
IDEMPOTENCY_ENCRYPTION_KEY=synthetic-idempotency
COURSE_INVITE_TTL_SECONDS=604800
JOIN_CAPABILITY_TTL_SECONDS=300
QR_JOIN_TOKEN_HASH_KEY=synthetic-qr-hash
QR_JOIN_SECRET_ENCRYPTION_KEY=synthetic-qr-encryption
QR_JOIN_SECRET_REPLAY_SECONDS=86400
PUSH_TOKEN_ENCRYPTION_KEY=synthetic-push
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
OBJECT_STORAGE_ENDPOINT=http://127.0.0.1:9000
OBJECT_STORAGE_ACCESS_KEY=roster-synthetic
OBJECT_STORAGE_SECRET_KEY=secret-roster-synthetic
MEDIA_STORAGE_ENDPOINT=http://127.0.0.1:9000
MEDIA_STORAGE_ACCESS_KEY=media-synthetic
MEDIA_STORAGE_SECRET_KEY=secret-media-synthetic
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
MAILPIT_SMTP_PORT=1025
MAILPIT_UI_PORT=8025
CORS_ALLOWLIST=http://127.0.0.1:3001,http://localhost:3001
MINIO_ROOT_USER=minio-synthetic
MINIO_ROOT_PASSWORD=secret-minio-synthetic
LOCAL_SEED_TEACHER_PASSWORD=synthetic-teacher
LOCAL_SEED_ADMIN_PASSWORD=synthetic-admin
`);

test("accepts the generated local TTL relationships", () => {
  assert.deepEqual(validateLocalEnvironment(validEnvironment()), []);
});

test("accepts a consistent set of custom local infrastructure ports", () => {
  const values = validEnvironment();
  values.set("PORT", "3100");
  values.set("POSTGRES_PORT", "15433");
  values.set(
    "DATABASE_URL",
    "postgresql://bnbu_app:synthetic@localhost:15433/bnbu_sports?schema=public",
  );
  values.set(
    "MIGRATION_DATABASE_URL",
    "postgresql://bnbu_migrator:synthetic@localhost:15433/bnbu_sports?schema=public",
  );
  values.set("MINIO_API_PORT", "19000");
  values.set("MINIO_CONSOLE_PORT", "19001");
  values.set("OBJECT_STORAGE_ENDPOINT", "http://localhost:19000");
  values.set("MEDIA_STORAGE_ENDPOINT", "http://localhost:19000");
  values.set("MAILPIT_SMTP_PORT", "11025");
  values.set("MAILPIT_UI_PORT", "18025");
  values.set("SMTP_PORT", "11025");

  assert.deepEqual(validateLocalEnvironment(values), []);
});

test("rejects a database URL whose port differs from the compose port", () => {
  const values = validEnvironment();
  values.set("POSTGRES_PORT", "15433");

  assert.ok(
    validateLocalEnvironment(values).includes("DATABASE_URL:not-local-postgres"),
  );
});

test("rejects MinIO credentials that a CLI could parse as flags", () => {
  const values = validEnvironment();
  values.set("MEDIA_STORAGE_SECRET_KEY", "-unsafe-synthetic-secret");

  assert.ok(
    validateLocalEnvironment(values).includes(
      "MEDIA_STORAGE_SECRET_KEY:unsafe-cli-prefix",
    ),
  );
});

for (const fixture of [
  {
    name: "idempotency lease must be shorter than retention",
    key: "IDEMPOTENCY_LEASE",
    value: "86400",
    failure: "IDEMPOTENCY_TTL:invalid-order",
  },
  {
    name: "QR replay window must cover idempotency retention",
    key: "QR_JOIN_SECRET_REPLAY_SECONDS",
    value: "86399",
    failure: "QR_REPLAY:shorter-than-idempotency",
  },
  {
    name: "join capability TTL must be shorter than course invite TTL",
    key: "JOIN_CAPABILITY_TTL_SECONDS",
    value: "604800",
    failure: "JOIN_CAPABILITY_TTL:not-shorter-than-course-invite",
  },
]) {
  test(fixture.name, () => {
    const values = validEnvironment();
    values.set(fixture.key, fixture.value);
    assert.ok(validateLocalEnvironment(values).includes(fixture.failure));
  });
}
