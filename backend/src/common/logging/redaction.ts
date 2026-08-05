const SENSITIVE_KEYS = new Set(
  [
    'authorization',
    'cookie',
    'accessToken',
    'refreshToken',
    'password',
    'verificationCode',
    'inviteToken',
    'joinCapability',
    'signedUrl',
    'uploadUrl',
    'accessUrl',
    'requiredHeaders',
    'storageKey',
    'sourceFileStorageKey',
    'storage_key',
    'source_file_storage_key',
    'primaryEmail',
    'primaryPhone',
    'studentNumber',
    'fullName',
    'identitySnapshot',
    'encryptedIdentitySnapshot',
    'secretCiphertext',
    'resultCiphertext',
    'tokenHash',
    'databaseUrl',
    'database_url',
    'minioSecretKey',
    'objectStorageAccessKey',
    'objectStorageSecretKey',
    'object_storage_access_key',
    'object_storage_secret_key',
    'mediaStorageAccessKey',
    'mediaStorageSecretKey',
    'media_storage_access_key',
    'media_storage_secret_key',
    'accessKey',
    'secretKey',
    'access_key',
    'secret_key',
    'minio_root_user',
    'minio_root_password',
    'token_signing_key',
    'idempotency_encryption_key',
    'security_hash_key',
    'qr_join_token_hash_key',
    'qr_join_secret_encryption_key',
    'fileChecksumSha256',
    'declaredChecksumSha256',
    'file_checksum_sha256',
    'fieldMappingSnapshot',
    'field_mapping_snapshot',
    'originalFileName',
    'sanitizedOriginalFileName',
    'fileName',
    'file_name',
    'rawStudentNumberSafe',
    'rawRowSnapshotSafe',
    'raw_student_number_safe',
    'raw_row_snapshot_safe',
    'internalNote',
    'fileBody',
    'rawRosterRow',
    'sourceFileStorageKey',
    'sourceChecksumSha256',
    'fileChecksumSha256',
    'fileName',
    'originalFileName',
    'fileContent',
    'rosterFile',
    'fieldMappingSnapshot',
    'rawStudentNumber',
    'rawStudentNumberSafe',
    'normalizedStudentNumber',
    'rawRowSnapshot',
    'rawRowSnapshotSafe',
    'subjectKey',
    'officialValue',
    'platformValue',
  ].map((key) => key.toLowerCase()),
);

export const REDACTED_VALUE = '[REDACTED]';

export function redactSensitive(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) return value.map((entry) => redactSensitive(entry, seen));

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? REDACTED_VALUE
      : redactSensitive(entry, seen);
  }
  return output;
}
