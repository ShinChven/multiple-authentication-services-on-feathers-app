import assert from 'assert';
import app from '../../src/app';

describe('\'test_user_role\' service', () => {
  it('registered the service', () => {
    const service = app.service('test-user-role');

    assert.ok(service, 'Registered the service');
  });
});
