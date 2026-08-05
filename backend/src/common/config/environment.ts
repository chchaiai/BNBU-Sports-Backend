export const APP_ENVIRONMENTS = ['local', 'test', 'development', 'staging', 'production'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
export type LogLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface ObjectStorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
}

export interface MediaConfig {
  storage: ObjectStorageConfig;
  uploadUrlTtlSeconds: number;
  accessUrlTtlSeconds: number;
  maxImageBytes: number;
  maxVideoBytes: number;
  maxVideoDurationSeconds: number;
  maxImagePixels: number;
  scannerMode: 'TEST_SIGNATURE' | 'EXTERNAL_REQUIRED';
  workerEnabled: boolean;
  workerPollMs: number;
}

export interface RuntimeConfig {
  appEnvironment: AppEnvironment;
  appVersion: string;
  port: number;
  logLevel: LogLevel;
  databaseUrl: string;
  tokenIssuer: string;
  tokenAudience: string;
  tokenSigningKey: string;
  tokenVerifyingKey: string;
  accessTokenTtlSeconds: number;
  refreshTokenAbsoluteTtlSeconds: number;
  refreshTokenIdleTtlSeconds: number;
  idempotencyRetentionSeconds: number;
  idempotencyLeaseSeconds: number;
  idempotencyEncryptionKey: Buffer;
  securityHashKey: string;
  authRateLimitWindowSeconds: number;
  authRateLimitMaxAttempts: number;
  corsAllowlist: ReadonlySet<string>;
  trustProxy: boolean;
  systemModeSource: 'database';
  requestBodyLimitBytes: number;
  requestTimeoutMs: number;
  courseInviteTtlSeconds: number;
  joinCapabilityTtlSeconds: number;
  qrJoinTokenHashKey: Buffer;
  qrJoinSecretEncryptionKey: Buffer;
  qrJoinSecretReplaySeconds: number;
  qrJoinPublicRateLimitWindowSeconds: number;
  qrJoinPublicRateLimitMaxRequests: number;
  objectStorage: ObjectStorageConfig | null;
  media: MediaConfig | null;
}

function required(raw: Record<string, unknown>, name: string): string {
  const value = raw[name];
  if (typeof value !== 'string' || value.trim().length === 0 || value.includes('CHANGE_ME')) {
    throw new Error(`${name} must be explicitly configured and cannot contain a placeholder`);
  }
  return value.trim();
}

function integer(
  raw: Record<string, unknown>,
  name: string,
  options: { minimum: number; maximum?: number },
): number {
  const text = required(raw, name);
  if (!/^[0-9]+$/.test(text)) throw new Error(`${name} must be an integer`);
  const value = Number.parseInt(text, 10);
  if (!Number.isSafeInteger(value) || value < options.minimum) {
    throw new Error(`${name} must be at least ${options.minimum}`);
  }
  if (options.maximum !== undefined && value > options.maximum) {
    throw new Error(`${name} must be at most ${options.maximum}`);
  }
  return value;
}

function postgresUrl(raw: Record<string, unknown>): string {
  const value = required(raw, 'DATABASE_URL');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgresql protocol');
  }
  return value;
}

function pem(raw: Record<string, unknown>, name: string, marker: string): string {
  const value = required(raw, name).replaceAll('\\n', '\n');
  if (!value.includes(`-----BEGIN ${marker}-----`) || !value.includes(`-----END ${marker}-----`)) {
    throw new Error(`${name} must be a PEM-encoded ${marker.toLowerCase()}`);
  }
  return value;
}

function base64Key(raw: Record<string, unknown>, name: string): Buffer {
  const value = required(raw, name);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`${name} must be standard base64`);
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length !== 32) {
    throw new Error(`${name} must decode to exactly 32 bytes`);
  }
  return decoded;
}

function allowlist(raw: Record<string, unknown>): ReadonlySet<string> {
  const values = required(raw, 'CORS_ALLOWLIST')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (values.length === 0) throw new Error('CORS_ALLOWLIST must contain at least one origin');

  for (const value of values) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`CORS_ALLOWLIST contains an invalid origin: ${value}`);
    }
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.origin !== value) {
      throw new Error(`CORS_ALLOWLIST entries must be exact HTTP(S) origins: ${value}`);
    }
  }

  return new Set(values);
}

function optionalBoolean(
  raw: Record<string, unknown>,
  name: string,
  defaultValue: boolean,
): boolean {
  const value = raw[name];
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value !== 'true' && value !== 'false') throw new Error(`${name} must be true or false`);
  return value === 'true';
}

function objectStorage(
  raw: Record<string, unknown>,
  appEnvironment: AppEnvironment,
): ObjectStorageConfig | null {
  const names = [
    'OBJECT_STORAGE_ENDPOINT',
    'OBJECT_STORAGE_REGION',
    'OBJECT_STORAGE_BUCKET',
    'OBJECT_STORAGE_ACCESS_KEY',
    'OBJECT_STORAGE_SECRET_KEY',
    'OBJECT_STORAGE_FORCE_PATH_STYLE',
  ] as const;
  const requiredForEnvironment =
    appEnvironment === 'production' || optionalBoolean(raw, 'OBJECT_STORAGE_REQUIRED', false);
  const presentCount = names.filter((name) => {
    const value = raw[name];
    return typeof value === 'string' && value.trim().length > 0;
  }).length;

  if (presentCount === 0 && !requiredForEnvironment) return null;
  if (presentCount !== names.length) {
    throw new Error('Object storage configuration must be either complete or omitted');
  }

  const endpointText = required(raw, 'OBJECT_STORAGE_ENDPOINT');
  let endpoint: URL;
  try {
    endpoint = new URL(endpointText);
  } catch {
    throw new Error('OBJECT_STORAGE_ENDPOINT must be a valid HTTP(S) URL');
  }
  if (
    (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') ||
    endpoint.username.length > 0 ||
    endpoint.password.length > 0 ||
    endpoint.search.length > 0 ||
    endpoint.hash.length > 0
  ) {
    throw new Error('OBJECT_STORAGE_ENDPOINT must be an HTTP(S) URL without credentials or query');
  }

  const bucket = required(raw, 'OBJECT_STORAGE_BUCKET');
  if (
    bucket.length < 3 ||
    bucket.length > 63 ||
    !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket) ||
    bucket.includes('..') ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(bucket)
  ) {
    throw new Error('OBJECT_STORAGE_BUCKET must be a valid DNS-compatible bucket name');
  }

  const accessKey = required(raw, 'OBJECT_STORAGE_ACCESS_KEY');
  const secretKey = required(raw, 'OBJECT_STORAGE_SECRET_KEY');
  if (accessKey.length < 3 || secretKey.length < 16) {
    throw new Error('Object storage credentials do not meet the minimum local-validation strength');
  }

  return {
    endpoint: endpoint.origin + endpoint.pathname.replace(/\/$/, ''),
    region: required(raw, 'OBJECT_STORAGE_REGION'),
    bucket,
    accessKey,
    secretKey,
    forcePathStyle: optionalBoolean(raw, 'OBJECT_STORAGE_FORCE_PATH_STYLE', true),
  };
}

function mediaConfiguration(
  raw: Record<string, unknown>,
  appEnvironment: AppEnvironment,
): MediaConfig | null {
  const storageNames = [
    'MEDIA_STORAGE_ENDPOINT',
    'MEDIA_STORAGE_REGION',
    'MEDIA_STORAGE_BUCKET',
    'MEDIA_STORAGE_ACCESS_KEY',
    'MEDIA_STORAGE_SECRET_KEY',
    'MEDIA_STORAGE_FORCE_PATH_STYLE',
  ] as const;
  const settingNames = [
    'MEDIA_UPLOAD_URL_TTL_SECONDS',
    'MEDIA_ACCESS_URL_TTL_SECONDS',
    'MEDIA_MAX_IMAGE_BYTES',
    'MEDIA_MAX_VIDEO_BYTES',
    'MEDIA_MAX_VIDEO_DURATION_SECONDS',
    'MEDIA_MAX_IMAGE_PIXELS',
    'MEDIA_SCANNER_MODE',
    'MEDIA_WORKER_ENABLED',
    'MEDIA_WORKER_POLL_MS',
  ] as const;
  const requiredForEnvironment =
    appEnvironment === 'production' || optionalBoolean(raw, 'MEDIA_STORAGE_REQUIRED', false);
  const names = [...storageNames, ...settingNames];
  const presentCount = names.filter((name) => {
    const value = raw[name];
    return typeof value === 'string' && value.trim().length > 0;
  }).length;
  if (presentCount === 0 && !requiredForEnvironment) return null;
  if (presentCount !== names.length) {
    throw new Error('Media configuration must be either complete or omitted');
  }

  const storageRaw: Record<string, unknown> = {
    OBJECT_STORAGE_ENDPOINT: raw.MEDIA_STORAGE_ENDPOINT,
    OBJECT_STORAGE_REGION: raw.MEDIA_STORAGE_REGION,
    OBJECT_STORAGE_BUCKET: raw.MEDIA_STORAGE_BUCKET,
    OBJECT_STORAGE_ACCESS_KEY: raw.MEDIA_STORAGE_ACCESS_KEY,
    OBJECT_STORAGE_SECRET_KEY: raw.MEDIA_STORAGE_SECRET_KEY,
    OBJECT_STORAGE_FORCE_PATH_STYLE: raw.MEDIA_STORAGE_FORCE_PATH_STYLE,
    OBJECT_STORAGE_REQUIRED: 'true',
  };
  const storage = objectStorage(storageRaw, appEnvironment);
  if (storage === null) throw new Error('Media object storage configuration is required');

  const scannerMode = required(raw, 'MEDIA_SCANNER_MODE');
  if (scannerMode !== 'TEST_SIGNATURE' && scannerMode !== 'EXTERNAL_REQUIRED') {
    throw new Error('MEDIA_SCANNER_MODE must be TEST_SIGNATURE or EXTERNAL_REQUIRED');
  }
  if (appEnvironment === 'production' && scannerMode === 'TEST_SIGNATURE') {
    throw new Error('MEDIA_SCANNER_MODE cannot use the local test scanner in production');
  }

  return {
    storage,
    uploadUrlTtlSeconds: integer(raw, 'MEDIA_UPLOAD_URL_TTL_SECONDS', {
      minimum: 30,
      maximum: 3600,
    }),
    accessUrlTtlSeconds: integer(raw, 'MEDIA_ACCESS_URL_TTL_SECONDS', {
      minimum: 30,
      maximum: 3600,
    }),
    maxImageBytes: integer(raw, 'MEDIA_MAX_IMAGE_BYTES', { minimum: 1024 }),
    maxVideoBytes: integer(raw, 'MEDIA_MAX_VIDEO_BYTES', { minimum: 1024 }),
    maxVideoDurationSeconds: integer(raw, 'MEDIA_MAX_VIDEO_DURATION_SECONDS', {
      minimum: 1,
    }),
    maxImagePixels: integer(raw, 'MEDIA_MAX_IMAGE_PIXELS', { minimum: 1 }),
    scannerMode,
    workerEnabled: optionalBoolean(raw, 'MEDIA_WORKER_ENABLED', false),
    workerPollMs: integer(raw, 'MEDIA_WORKER_POLL_MS', { minimum: 100, maximum: 60_000 }),
  };
}

export function validateEnvironment(raw: Record<string, unknown>): Record<string, unknown> {
  const appEnvironment = required(raw, 'APP_ENV');
  if (!APP_ENVIRONMENTS.includes(appEnvironment as AppEnvironment)) {
    throw new Error(`APP_ENV must be one of ${APP_ENVIRONMENTS.join(', ')}`);
  }

  const logLevel = required(raw, 'LOG_LEVEL');
  const logLevels: readonly LogLevel[] = [
    'silent',
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
  ];
  if (!logLevels.includes(logLevel as LogLevel)) {
    throw new Error(`LOG_LEVEL must be one of ${logLevels.join(', ')}`);
  }

  const port = integer(raw, 'PORT', {
    minimum: appEnvironment === 'test' ? 0 : 1,
    maximum: 65_535,
  });
  const accessTokenTtlSeconds = integer(raw, 'ACCESS_TOKEN_TTL', { minimum: 1 });
  const refreshTokenAbsoluteTtlSeconds = integer(raw, 'REFRESH_TOKEN_ABSOLUTE_TTL', { minimum: 1 });
  const refreshTokenIdleTtlSeconds = integer(raw, 'REFRESH_TOKEN_IDLE_TTL', { minimum: 1 });
  if (
    accessTokenTtlSeconds >= refreshTokenIdleTtlSeconds ||
    refreshTokenIdleTtlSeconds > refreshTokenAbsoluteTtlSeconds
  ) {
    throw new Error('Token TTLs must satisfy access < refresh idle <= refresh absolute');
  }

  const idempotencyRetentionSeconds = integer(raw, 'IDEMPOTENCY_RETENTION', { minimum: 1 });
  const idempotencyLeaseSeconds = integer(raw, 'IDEMPOTENCY_LEASE', { minimum: 1 });
  if (idempotencyLeaseSeconds >= idempotencyRetentionSeconds) {
    throw new Error('IDEMPOTENCY_LEASE must be shorter than IDEMPOTENCY_RETENTION');
  }

  const courseInviteTtlSeconds = integer(raw, 'COURSE_INVITE_TTL_SECONDS', { minimum: 60 });
  const joinCapabilityTtlSeconds = integer(raw, 'JOIN_CAPABILITY_TTL_SECONDS', {
    minimum: 30,
  });
  if (joinCapabilityTtlSeconds >= courseInviteTtlSeconds) {
    throw new Error('JOIN_CAPABILITY_TTL_SECONDS must be shorter than COURSE_INVITE_TTL_SECONDS');
  }
  const qrJoinSecretReplaySeconds = integer(raw, 'QR_JOIN_SECRET_REPLAY_SECONDS', {
    minimum: 60,
  });
  if (qrJoinSecretReplaySeconds < idempotencyRetentionSeconds) {
    throw new Error('QR_JOIN_SECRET_REPLAY_SECONDS must cover IDEMPOTENCY_RETENTION');
  }

  const trustProxy = required(raw, 'TRUST_PROXY');
  if (trustProxy !== 'true' && trustProxy !== 'false') {
    throw new Error('TRUST_PROXY must be true or false');
  }

  const systemModeSource = required(raw, 'SYSTEM_MODE_SOURCE');
  if (systemModeSource !== 'database') {
    throw new Error('SYSTEM_MODE_SOURCE must be database for the Foundation service');
  }

  const securityHashKey = required(raw, 'SECURITY_HASH_KEY');
  if (securityHashKey.length < 32)
    throw new Error('SECURITY_HASH_KEY must contain at least 32 characters');

  const runtimeConfig: RuntimeConfig = {
    appEnvironment: appEnvironment as AppEnvironment,
    appVersion: required(raw, 'APP_VERSION'),
    port,
    logLevel: logLevel as LogLevel,
    databaseUrl: postgresUrl(raw),
    tokenIssuer: required(raw, 'TOKEN_ISSUER'),
    tokenAudience: required(raw, 'TOKEN_AUDIENCE'),
    tokenSigningKey: pem(raw, 'TOKEN_SIGNING_KEY', 'PRIVATE KEY'),
    tokenVerifyingKey: pem(raw, 'TOKEN_VERIFYING_KEY', 'PUBLIC KEY'),
    accessTokenTtlSeconds,
    refreshTokenAbsoluteTtlSeconds,
    refreshTokenIdleTtlSeconds,
    idempotencyRetentionSeconds,
    idempotencyLeaseSeconds,
    idempotencyEncryptionKey: base64Key(raw, 'IDEMPOTENCY_ENCRYPTION_KEY'),
    securityHashKey,
    authRateLimitWindowSeconds: integer(raw, 'AUTH_RATE_LIMIT_WINDOW_SECONDS', {
      minimum: 1,
    }),
    authRateLimitMaxAttempts: integer(raw, 'AUTH_RATE_LIMIT_MAX_ATTEMPTS', { minimum: 1 }),
    corsAllowlist: allowlist(raw),
    trustProxy: trustProxy === 'true',
    systemModeSource,
    requestBodyLimitBytes: integer(raw, 'REQUEST_BODY_LIMIT_BYTES', { minimum: 1 }),
    requestTimeoutMs: integer(raw, 'REQUEST_TIMEOUT_MS', { minimum: 100, maximum: 120_000 }),
    courseInviteTtlSeconds,
    joinCapabilityTtlSeconds,
    qrJoinTokenHashKey: base64Key(raw, 'QR_JOIN_TOKEN_HASH_KEY'),
    qrJoinSecretEncryptionKey: base64Key(raw, 'QR_JOIN_SECRET_ENCRYPTION_KEY'),
    qrJoinSecretReplaySeconds,
    qrJoinPublicRateLimitWindowSeconds: integer(raw, 'QR_JOIN_PUBLIC_RATE_LIMIT_WINDOW_SECONDS', {
      minimum: 1,
    }),
    qrJoinPublicRateLimitMaxRequests: integer(raw, 'QR_JOIN_PUBLIC_RATE_LIMIT_MAX_REQUESTS', {
      minimum: 1,
    }),
    objectStorage: objectStorage(raw, appEnvironment as AppEnvironment),
    media: mediaConfiguration(raw, appEnvironment as AppEnvironment),
  };

  return { ...raw, RUNTIME_CONFIG: runtimeConfig };
}
