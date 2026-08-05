import 'reflect-metadata';

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { operationPolicies } from '../../src/generated/operation-policies.generated.js';
import { AppendLocationSamplesRequestDto } from '../../src/modules/client-capabilities/client-capabilities.dto.js';

describe('Stage 21 client capability security', () => {
  it('binds every GPS mutation to a student-owned existing ExerciseSession', () => {
    for (const operationId of [
      'startExerciseLocationTrack',
      'appendExerciseLocationSamples',
      'finalizeExerciseLocationTrack',
    ] as const) {
      const policy = operationPolicies[operationId];
      assert.deepEqual(policy.allowedRoles, ['STUDENT']);
      assert.equal(policy.organizationScope, 'PRINCIPAL_ORGANIZATION');
      assert.equal(policy.resourceScope, 'SELF');
      assert.equal(policy.resourceResolver, 'EXERCISE_SESSION_FROM_PATH');
    }
  });

  it('uses record scope for summaries and reserves privacy-policy mutation for ADMIN', () => {
    const summary = operationPolicies.getExerciseRecordLocationSummary;
    assert.deepEqual(summary.allowedRoles, ['STUDENT', 'TEACHER', 'ADMIN']);
    assert.equal(summary.resourceScope, 'ROLE_SCOPED');
    assert.equal(summary.resourceResolver, 'EXERCISE_RECORD_FROM_PATH');

    const updatePolicy = operationPolicies.updateLocationPrivacyPolicy;
    assert.deepEqual(updatePolicy.allowedRoles, ['ADMIN']);
    assert.equal(updatePolicy.resourceScope, 'ORGANIZATION');
    assert.equal(updatePolicy.resourceResolver, 'PRINCIPAL_ORGANIZATION');
  });

  it('rejects out-of-range coordinates and more than one bounded batch', async () => {
    const invalidCoordinate = plainToInstance(AppendLocationSamplesRequestDto, {
      samples: [
        {
          sampleId: '0198c74b-7dc0-7000-8000-000000000011',
          observedAt: '2026-08-05T12:00:00Z',
          latitude: 100,
          longitude: 200,
          accuracyMeters: 10,
        },
      ],
      expectedVersion: 1,
    });
    assert.ok((await validate(invalidCoordinate)).length > 0);

    const oversized = plainToInstance(AppendLocationSamplesRequestDto, {
      samples: Array.from({ length: 101 }, (_, index) => ({
        sampleId: `0198c74b-7dc0-7000-8000-${String(index).padStart(12, '0')}`,
        observedAt: '2026-08-05T12:00:00Z',
        latitude: 22.3,
        longitude: 114.2,
        accuracyMeters: 10,
      })),
      expectedVersion: 1,
    });
    assert.ok((await validate(oversized)).length > 0);
  });
});
