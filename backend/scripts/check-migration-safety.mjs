import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(scriptDirectory, '..');
const migrationsDirectory = path.join(backendDirectory, 'prisma', 'migrations');
const migrationDirectories = fs
  .readdirSync(migrationsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const expectedMigrationDirectories = [
  '0001_greenfield_foundation',
  '0002_teaching_structure',
  '0003_identity_enrollment_qr_join',
  '0004_official_roster_alignment',
  '0005_exercise_session',
  '0006_media_evidence',
  '0007_exercise_record',
  '0008_review_core',
  '0009_score',
  '0010_export_audit_governance',
];

if (
  migrationDirectories.length !== expectedMigrationDirectories.length ||
  migrationDirectories.some((directory, index) => directory !== expectedMigrationDirectories[index])
) {
  throw new Error(
    `Expected exactly ${expectedMigrationDirectories.join(', ')}, found: ${migrationDirectories.join(', ')}`,
  );
}

const forbiddenSql = [
  /\bDROP\s+(?:TABLE|SCHEMA|DATABASE)\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE\b[\s\S]*?\bDROP\b/i,
  /\bDELETE\s+FROM\b/i,
];

const migrations = expectedMigrationDirectories.map((migrationId) => {
  const migrationDirectory = path.join(migrationsDirectory, migrationId);
  const sql = fs.readFileSync(path.join(migrationDirectory, 'migration.sql'), 'utf8');
  const manifest = JSON.parse(
    fs.readFileSync(path.join(migrationDirectory, 'manifest.json'), 'utf8'),
  );
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');

  if (manifest.migrationId !== migrationId) {
    throw new Error(`${migrationId}: migration ID mismatch`);
  }
  if (manifest.sha256 !== checksum) {
    throw new Error(`${migrationId}: migration checksum mismatch: ${checksum}`);
  }
  if (manifest.destructive !== false) {
    throw new Error(`${migrationId}: migration must declare destructive=false`);
  }
  let destructiveScanSql = [
    '0002_teaching_structure',
    '0005_exercise_session',
    '0006_media_evidence',
    '0007_exercise_record',
    '0010_export_audit_governance',
  ].includes(migrationId)
    ? sql.replace(
        'DROP CONSTRAINT "audit_logs_action_type_check"',
        'REPLACE CONSTRAINT "audit_logs_action_type_check"',
      )
    : sql;
  if (migrationId === '0008_review_core') {
    destructiveScanSql = destructiveScanSql
      .replace(
        'DROP CONSTRAINT "review_records_shape_check"',
        'REPLACE CONSTRAINT "review_records_shape_check"',
      )
      .replace(
        'DROP CONSTRAINT "exercise_record_events_type_check"',
        'REPLACE CONSTRAINT "exercise_record_events_type_check"',
      );
  }
  if (
    migrationId === '0002_teaching_structure' &&
    !sql.includes('DROP CONSTRAINT "audit_logs_action_type_check"')
  ) {
    throw new Error('0002_teaching_structure: audit action CHECK expansion is required');
  }
  if (
    migrationId === '0005_exercise_session' &&
    !sql.includes('DROP CONSTRAINT "audit_logs_action_type_check"')
  ) {
    throw new Error('0005_exercise_session: audit action CHECK expansion is required');
  }
  if (
    migrationId === '0006_media_evidence' &&
    !sql.includes('DROP CONSTRAINT "audit_logs_action_type_check"')
  ) {
    throw new Error('0006_media_evidence: audit action CHECK expansion is required');
  }
  if (
    migrationId === '0007_exercise_record' &&
    !sql.includes('DROP CONSTRAINT "audit_logs_action_type_check"')
  ) {
    throw new Error('0007_exercise_record: audit action CHECK expansion is required');
  }
  if (
    migrationId === '0010_export_audit_governance' &&
    (!sql.includes('DROP CONSTRAINT "audit_logs_action_type_check"') ||
      !sql.includes("'AUDIT_LOG_READ'"))
  ) {
    throw new Error('0010_export_audit_governance: audit read action CHECK expansion is required');
  }
  for (const pattern of forbiddenSql) {
    if (pattern.test(destructiveScanSql)) {
      throw new Error(`${migrationId}: forbidden destructive SQL matched ${pattern}`);
    }
  }
  if (/\b(?:gen_random_uuid|uuid_generate_v\d)\s*\(/i.test(sql)) {
    throw new Error(`${migrationId}: database-generated UUID defaults violate the UUIDv7 baseline`);
  }

  return { migrationId, sql, checksum };
});

const foundation = migrations[0];
const teachingStructure = migrations[1];
const identityEnrollmentQrJoin = migrations[2];
const officialRosterAlignment = migrations[3];
const exerciseSession = migrations[4];
const mediaEvidence = migrations[5];
const exerciseRecord = migrations[6];
const reviewCore = migrations[7];
const scoreCore = migrations[8];
const exportAuditGovernance = migrations[9];
const immutableFoundationChecksum =
  '0573e3d13018e0db103ef4b605eb35278723174507b37379425a489b10e1462d';
if (foundation.checksum !== immutableFoundationChecksum) {
  throw new Error('0001_greenfield_foundation is immutable and its checksum changed');
}
const immutableTeachingStructureChecksum =
  'bc62c8cc42989da02eb5be92c7c68f64a72b90e6a41b3913c169333d5fbfbc41';
if (teachingStructure.checksum !== immutableTeachingStructureChecksum) {
  throw new Error('0002_teaching_structure is immutable and its checksum changed');
}
const immutableIdentityEnrollmentQrJoinChecksum =
  '032b2f001638de63495bdb8d9bd3979ab54679eaaa7802d7526c6e5e24aaa5b7';
if (identityEnrollmentQrJoin.checksum !== immutableIdentityEnrollmentQrJoinChecksum) {
  throw new Error('0003_identity_enrollment_qr_join is immutable and its checksum changed');
}

const foundationTables = [
  'organizations',
  'system_policies',
  'users',
  'student_profiles',
  'teacher_profiles',
  'admin_profiles',
  'auth_sessions',
  'refresh_tokens',
  'semesters',
  'idempotency_records',
  'audit_logs',
  'outbox_events',
];
const teachingStructureTables = ['courses', 'class_sections', 'class_section_excluded_dates'];
const identityEnrollmentQrJoinTables = [
  'course_invites',
  'enrollments',
  'enrollment_status_events',
  'join_capabilities',
];
const officialRosterAlignmentTables = [
  'official_roster_imports',
  'official_roster_entries',
  'roster_alignment_runs',
  'roster_alignment_platform_entries',
  'roster_alignment_results',
  'roster_resolution_events',
];
const exerciseSessionTables = [
  'exercise_sessions',
  'exercise_session_segments',
  'exercise_session_events',
];
const mediaEvidenceTables = [
  'media_evidence',
  'media_upload_sessions',
  'media_status_events',
  'media_processing_attempts',
];
const exerciseRecordTables = [
  'exercise_records',
  'exercise_record_media',
  'exercise_record_daily_slots',
  'exercise_record_events',
  'review_records',
];
const scoreTables = [
  'score_rules',
  'score_rule_approval_events',
  'student_scores',
  'student_score_revisions',
  'score_contributions',
  'score_adjustments',
  'score_adjustment_approval_events',
  'score_publication_events',
  'score_recalculation_attempts',
];

function assertExactTables(migration, expectedTables) {
  const createdTables = [...migration.sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map(
    (match) => match[1],
  );
  if (
    createdTables.length !== expectedTables.length ||
    expectedTables.some((table) => !createdTables.includes(table))
  ) {
    throw new Error(
      `${migration.migrationId}: expected exactly ${expectedTables.join(', ')}, found ${createdTables.join(', ')}`,
    );
  }
}

assertExactTables(foundation, foundationTables);
assertExactTables(teachingStructure, teachingStructureTables);
assertExactTables(identityEnrollmentQrJoin, identityEnrollmentQrJoinTables);
assertExactTables(officialRosterAlignment, officialRosterAlignmentTables);
assertExactTables(exerciseSession, exerciseSessionTables);
assertExactTables(mediaEvidence, mediaEvidenceTables);
assertExactTables(exerciseRecord, exerciseRecordTables);
assertExactTables(reviewCore, []);
assertExactTables(scoreCore, scoreTables);
assertExactTables(exportAuditGovernance, []);

const laterBusinessTables = ['export_jobs'];
for (const table of laterBusinessTables) {
  if (migrations.some(({ sql }) => sql.includes(`CREATE TABLE "${table}"`))) {
    throw new Error(`Later business-gated table must not exist: ${table}`);
  }
}
for (const table of ['score_rules', 'student_scores', 'score_adjustments']) {
  if (migrations.slice(0, 8).some(({ sql }) => sql.includes(`CREATE TABLE "${table}"`))) {
    throw new Error(`Score table appeared before 0009_score: ${table}`);
  }
}

const foundationInvariants = [
  'semesters_one_current_per_organization_idx',
  'refresh_tokens_parent_token_id_organization_id_fkey',
  'refresh_tokens_replaced_by_token_id_organization_id_fkey',
  'users_role_check',
  'student_profiles_grade_year_check',
  'audit_logs_action_type_check',
  'audit_logs_append_only_trigger',
  'student_profiles_role_exclusivity_trigger',
  'outbox_events_state_shape_check',
];
const teachingStructureInvariants = [
  'courses_organization_course_code_key',
  'courses_created_by_organization_id_fkey',
  'courses_status_check',
  'class_sections_semester_course_class_code_key',
  'class_sections_course_id_organization_id_fkey',
  'class_sections_semester_id_organization_id_fkey',
  'class_sections_teacher_id_organization_id_fkey',
  'class_sections_close_shape_check',
  'class_sections_calendar_trigger',
  'class_section_excluded_dates_range_trigger',
  "'COURSE_UPDATED'",
  "'COURSE_STATUS_CHANGED'",
];
const identityEnrollmentQrJoinInvariants = [
  'course_invites_one_active_per_section_idx',
  'course_invites_token_hash_key',
  'join_capabilities_token_hash_key',
  'join_capabilities_consumed_shape_check',
  'enrollments_class_section_student_key',
  'enrollments_one_active_per_semester_student_idx',
  'enrollments_class_section_semester_organization_fkey',
  'enrollment_status_events_append_only_trigger',
  'student_profiles_id_organization_id_key',
  'class_sections_id_semester_organization_key',
];
const officialRosterAlignmentInvariants = [
  'official_roster_imports_one_current_per_section_idx',
  'official_roster_imports_section_version_key',
  'official_roster_imports_mutation_guard_trigger',
  'official_roster_entries_valid_student_number_key',
  'official_roster_entries_append_only_trigger',
  'roster_alignment_runs_one_running_per_section_idx',
  'roster_alignment_runs_one_current_per_section_idx',
  'roster_alignment_runs_mutation_guard_trigger',
  'roster_platform_entries_append_only_trigger',
  'roster_alignment_results_current_section_subject_key',
  'roster_alignment_results_mutation_guard_trigger',
  'roster_resolution_events_evidence_reference_check',
  'roster_resolution_events_append_only_trigger',
  'enrollments_id_semester_section_student_organization_key',
  'enrollment_status_events_id_organization_id_key',
];
const exerciseSessionInvariants = [
  'exercise_sessions_one_active_student_key',
  'exercise_sessions_enrollment_scope_fkey',
  'exercise_sessions_mutation_guard_trigger',
  'exercise_session_segments_one_open_key',
  'exercise_session_segments_session_sequence_key',
  'exercise_session_segments_mutation_guard_trigger',
  'exercise_session_events_session_version_key',
  'exercise_session_events_session_client_event_key',
  'exercise_session_events_append_only_trigger',
  'exercise_sessions_actual_duration_check',
  'exercise_sessions_terminal_shape_check',
];
const mediaEvidenceInvariants = [
  'exercise_sessions_id_student_organization_key',
  'media_evidence_session_owner_organization_fkey',
  'media_evidence_verified_facts_check',
  'media_evidence_verified_complete_check',
  'media_evidence_active_quota_check',
  'media_evidence_mutation_guard_trigger',
  'media_upload_sessions_media_organization_key',
  'media_upload_sessions_mutation_guard_trigger',
  'media_status_events_media_version_key',
  'media_status_events_append_only_trigger',
  'media_processing_attempts_media_attempt_phase_key',
  'media_processing_attempts_append_only_trigger',
  "'MEDIA_UPLOAD_INITIATED'",
  "'MEDIA_UPLOAD_CONFIRMED'",
];
const exerciseRecordInvariants = [
  'exercise_records_session_id_key',
  'exercise_records_enrollment_scope_fkey',
  'exercise_records_session_scope_fkey',
  'exercise_records_mutation_guard_trigger',
  'exercise_records_no_delete_trigger',
  'exercise_record_media_media_id_key',
  'exercise_record_media_insert_guard_trigger',
  'exercise_record_media_append_only_trigger',
  'exercise_record_daily_slots_pkey',
  'exercise_record_daily_slots_append_only_trigger',
  'exercise_record_events_record_version_key',
  'exercise_record_events_append_only_trigger',
  'review_records_record_version_key',
  'review_records_initial_pending_check',
  'review_records_append_only_trigger',
  "'EXERCISE_RECORD_DRAFT_CREATED'",
  "'EXERCISE_RECORD_DRAFT_UPDATED'",
  "'EXERCISE_RECORD_SUBMITTED'",
  "'EXERCISE_RECORD_DISCARDED'",
];

for (const invariant of foundationInvariants) {
  if (!foundation.sql.includes(invariant)) {
    throw new Error(`0001_greenfield_foundation: missing invariant ${invariant}`);
  }
}
for (const invariant of teachingStructureInvariants) {
  if (!teachingStructure.sql.includes(invariant)) {
    throw new Error(`0002_teaching_structure: missing invariant ${invariant}`);
  }
}
for (const invariant of identityEnrollmentQrJoinInvariants) {
  if (!identityEnrollmentQrJoin.sql.includes(invariant)) {
    throw new Error(`0003_identity_enrollment_qr_join: missing invariant ${invariant}`);
  }
}
for (const invariant of officialRosterAlignmentInvariants) {
  if (!officialRosterAlignment.sql.includes(invariant)) {
    throw new Error(`0004_official_roster_alignment: missing invariant ${invariant}`);
  }
}
for (const invariant of exerciseSessionInvariants) {
  if (!exerciseSession.sql.includes(invariant)) {
    throw new Error(`0005_exercise_session: missing invariant ${invariant}`);
  }
}
for (const invariant of mediaEvidenceInvariants) {
  if (!mediaEvidence.sql.includes(invariant)) {
    throw new Error(`0006_media_evidence: missing invariant ${invariant}`);
  }
}
for (const invariant of exerciseRecordInvariants) {
  if (!exerciseRecord.sql.includes(invariant)) {
    throw new Error(`0007_exercise_record: missing invariant ${invariant}`);
  }
}
const reviewCoreInvariants = [
  'review_records_insert_guard_trigger',
  'review_records_previous_version_check',
  "'REVIEWED'",
  "'REOPENED'",
  `(OLD."status" = 'REVIEWED' AND NEW."status" = 'SUBMITTED')`,
];
for (const invariant of reviewCoreInvariants) {
  if (!reviewCore.sql.includes(invariant)) {
    throw new Error(`0008_review_core: missing invariant ${invariant}`);
  }
}

const scoreCoreInvariants = [
  'score_rules_one_active_per_section_key',
  'score_rules_definition_guard_trigger',
  'score_rule_approval_events_append_only_trigger',
  'student_scores_enrollment_scope_fkey',
  'student_score_revisions_source_key',
  'student_score_revisions_append_only_trigger',
  'score_contributions_revision_record_key',
  'score_contributions_append_only_trigger',
  'score_adjustments_values_check',
  'score_adjustments_definition_guard_trigger',
  'score_adjustment_approval_events_append_only_trigger',
  'score_publication_events_append_only_trigger',
  'score_recalculation_attempts_source_key',
];
for (const invariant of scoreCoreInvariants) {
  if (!scoreCore.sql.includes(invariant)) {
    throw new Error(`0009_score: missing invariant ${invariant}`);
  }
}

for (const invariant of ['audit_logs_action_type_check', "'AUDIT_LOG_READ'"]) {
  if (!exportAuditGovernance.sql.includes(invariant)) {
    throw new Error(`0010_export_audit_governance: missing invariant ${invariant}`);
  }
}

for (const migration of migrations) {
  const foreignKeyCount = (migration.sql.match(/\bFOREIGN KEY\b/g) ?? []).length;
  const uniqueCount = (migration.sql.match(/CREATE UNIQUE INDEX/g) ?? []).length;
  const checkCount = (migration.sql.match(/CONSTRAINT "[^"]+"\s+CHECK/g) ?? []).length;
  const indexCount = (migration.sql.match(/CREATE(?: UNIQUE)? INDEX/g) ?? []).length;
  process.stdout.write(
    `${migration.migrationId}: PASS (${[...migration.sql.matchAll(/CREATE TABLE "([^"]+)"/g)].length} tables, ${foreignKeyCount} foreign keys, ${uniqueCount} unique indexes, ${checkCount} checks, ${indexCount} total indexes, sha256=${migration.checksum})\n`,
  );
}
process.stdout.write(
  'Migration safety: PASS (forward-only Foundation through Audit Read governance)\n',
);
