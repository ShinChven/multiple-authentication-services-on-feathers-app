// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import assert from 'assert';
import app from '../../src/app';

describe('\'clients\' service', () => {
  it('registered the service', () => {
    const service = app.service('clients');

    assert.ok(service, 'Registered the service');
  });
});
