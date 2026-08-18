import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createTencentCvmRoleAwsCredentialProvider } from '../../src/common/object-storage/tencent-cvm-role-credential-provider.js';

describe('Tencent CVM role AWS credential bridge', () => {
  it('maps temporary credentials and the security token for COS requests', async () => {
    const provider = createTencentCvmRoleAwsCredentialProvider({
      getCredential: () =>
        Promise.resolve({
          secretId: 'synthetic-temporary-id',
          secretKey: 'synthetic-temporary-key',
          token: 'synthetic-security-token',
        }),
    });
    assert.deepEqual(await provider(), {
      accessKeyId: 'synthetic-temporary-id',
      secretAccessKey: 'synthetic-temporary-key',
      sessionToken: 'synthetic-security-token',
    });
  });

  it('fails closed without exposing provider details or accepting an absent token', async () => {
    const failed = createTencentCvmRoleAwsCredentialProvider({
      getCredential: () => Promise.reject(new Error('sensitive metadata response')),
    });
    await assert.rejects(
      failed(),
      (error: unknown) =>
        error instanceof Error &&
        error.message === 'Tencent CVM role credentials could not be loaded',
    );
    const incomplete = createTencentCvmRoleAwsCredentialProvider({
      getCredential: () =>
        Promise.resolve({ secretId: 'synthetic-id', secretKey: 'synthetic-key' }),
    });
    await assert.rejects(incomplete(), /credentials are incomplete/);
  });
});
