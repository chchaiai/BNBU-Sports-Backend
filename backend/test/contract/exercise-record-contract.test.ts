import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { parse } from 'yaml';

import { operationPolicies } from '../../src/generated/operation-policies.generated.js';
import { OPERATION_ID_METADATA } from '../../src/common/policy/operation-policy.decorator.js';
import { ExerciseRecordsController } from '../../src/modules/exercise-records/interface/http/exercise-records.controller.js';

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  assert.equal(typeof value, 'object', `${label} must be an object`);
  assert.notEqual(value, null, `${label} must not be null`);
  assert.equal(Array.isArray(value), false, `${label} must not be an array`);
  return value as JsonObject;
}

function stringArray(value: unknown, label: string): string[] {
  assert.ok(Array.isArray(value), `${label} must be an array`);
  const result = value.filter((item): item is string => typeof item === 'string');
  assert.equal(result.length, value.length);
  return result;
}

const contract = object(
  parse(
    readFileSync(new URL('../../../docs/backend-contracts/openapi.yaml', import.meta.url), 'utf8'),
  ),
  'OpenAPI',
);

describe('Stage 16 ExerciseRecord contract', () => {
  it('binds seven operations to real handlers and role-scoped resolvers', () => {
    const expected = [
      [
        '/exercise-records',
        'get',
        'listExerciseRecords',
        'list',
        ['STUDENT', 'TEACHER', 'ADMIN'],
        'EXERCISE_RECORD_LIST_SCOPE',
      ],
      [
        '/exercise-records',
        'post',
        'createExerciseRecordDraft',
        'create',
        ['STUDENT'],
        'EXERCISE_SESSION_FROM_REQUEST',
      ],
      [
        '/exercise-records/{recordId}',
        'get',
        'getExerciseRecord',
        'get',
        ['STUDENT', 'TEACHER', 'ADMIN'],
        'EXERCISE_RECORD_FROM_PATH',
      ],
      [
        '/exercise-records/{recordId}',
        'patch',
        'updateExerciseRecordDraft',
        'update',
        ['STUDENT'],
        'EXERCISE_RECORD_FROM_PATH',
      ],
      [
        '/exercise-records/{recordId}/submit',
        'post',
        'submitExerciseRecord',
        'submit',
        ['STUDENT'],
        'EXERCISE_RECORD_FROM_PATH',
      ],
      [
        '/exercise-records/{recordId}/discard',
        'post',
        'discardExerciseRecord',
        'discard',
        ['STUDENT'],
        'EXERCISE_RECORD_FROM_PATH',
      ],
      [
        '/exercise-records/{recordId}/withdraw',
        'post',
        'withdrawExerciseRecord',
        'withdraw',
        ['STUDENT'],
        'EXERCISE_RECORD_FROM_PATH',
      ],
    ] as const;
    const paths = object(contract.paths, 'paths');
    for (const [path, method, operationId, controllerMethod, roles, resolver] of expected) {
      const operation = object(object(paths[path], path)[method], operationId);
      const policy = object(operation['x-access-policy'], `${operationId} policy`);
      assert.equal(operation.operationId, operationId);
      assert.deepEqual(stringArray(policy.allowedRoles, 'roles'), roles);
      assert.equal(policy.resourceResolver, resolver);
      assert.equal(policy.defaultDeny, true);
      assert.equal(operationPolicies[operationId].resourceResolver, resolver);
      const descriptor = Object.getOwnPropertyDescriptor(
        ExerciseRecordsController.prototype,
        controllerMethod,
      );
      const handler: unknown = descriptor?.value;
      if (typeof handler !== 'function') {
        throw new Error(`${controllerMethod} handler is missing`);
      }
      assert.equal(Reflect.getMetadata(OPERATION_ID_METADATA, handler), operationId);
    }
  });

  it('freezes server-derived duration, safe currentReview, and private media boundaries', () => {
    const schemas = object(object(contract.components, 'components').schemas, 'schemas');
    const create = object(schemas.CreateExerciseRecordRequest, 'create');
    const createFields = Object.keys(object(create.properties, 'create fields'));
    for (const forbidden of [
      'organizationId',
      'studentId',
      'enrollmentId',
      'teacherId',
      'businessDate',
      'actualDurationSeconds',
      'creditedDurationSeconds',
      'status',
    ]) {
      assert.equal(createFields.includes(forbidden), false);
    }
    const reviewFields = Object.keys(
      object(object(schemas.StudentCurrentReview, 'review').properties, 'review fields'),
    );
    assert.deepEqual(reviewFields, ['result', 'reasonCode', 'publicComment']);
    const mediaFields = Object.keys(
      object(object(schemas.MediaEvidence, 'media').properties, 'media fields'),
    );
    assert.equal(mediaFields.includes('recordId'), true);
    assert.equal(mediaFields.includes('storageKey'), false);
  });

  it('keeps withdraw as a routed default deny and Review handlers outside the Record controller', () => {
    const paths = object(contract.paths, 'paths');
    const withdraw = object(
      object(paths['/exercise-records/{recordId}/withdraw'], 'withdraw path').post,
      'withdraw',
    );
    assert.equal(withdraw['x-enabled-by-default'], false);
    assert.equal(withdraw['x-business-blocker'], 'ADR-020');
    assert.equal(withdraw['x-default-deny-error'], 'EXERCISE_RECORD_WITHDRAWAL_NOT_ALLOWED');
    assert.equal(
      Object.getOwnPropertyDescriptor(ExerciseRecordsController.prototype, 'review'),
      undefined,
    );
  });
});
