import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApplicationError } from '../../src/common/errors/application-error.js';
import {
  assertCreditableDuration,
  creditedDuration,
  normalizeRecordContent,
} from '../../src/modules/exercise-records/domain/exercise-record.js';

describe('ExerciseRecord domain rules', () => {
  it('derives credited duration only from the server duration boundaries', () => {
    assert.equal(creditedDuration(0n), 0n);
    assert.equal(creditedDuration(3599n), 0n);
    assert.equal(creditedDuration(3600n), 3600n);
    assert.equal(creditedDuration(7199n), 3600n);
    assert.equal(creditedDuration(7200n), 7200n);
    for (const value of [-1n, 7201n]) {
      assert.throws(
        () => creditedDuration(value),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.code === 'EXERCISE_RECORD_DURATION_NOT_CREDITABLE',
      );
    }
    assert.throws(
      () => assertCreditableDuration(3599n),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.code === 'EXERCISE_RECORD_DURATION_NOT_CREDITABLE',
    );
  });

  it('normalizes optional content without inventing a second sport taxonomy', () => {
    assert.deepEqual(
      normalizeRecordContent({
        creditType: 'GENERAL',
        sportType: 'RUNNING',
        sportName: null,
        description: '  Synthetic run  ',
        studentRemark: '   ',
      }),
      {
        creditType: 'GENERAL',
        sportType: 'RUNNING',
        sportName: null,
        description: 'Synthetic run',
        studentRemark: null,
      },
    );
    assert.throws(
      () =>
        normalizeRecordContent({
          creditType: 'GENERAL',
          sportType: 'OTHER',
          description: 'Synthetic exercise',
        }),
      (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_FAILED',
    );
    assert.throws(
      () =>
        normalizeRecordContent({
          creditType: 'GENERAL',
          sportType: 'RUNNING',
          sportName: 'forged subtype',
          description: 'Synthetic exercise',
        }),
      (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_FAILED',
    );
  });
});
