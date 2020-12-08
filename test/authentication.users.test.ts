// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import assert from 'assert';
import app from '../src/app';

describe('Users Authentication', () => {
  it('registered the Users authentication service', () => {
    assert.ok(app.service('authentication/users'));
  });

  describe('local strategy', () => {
    const userInfo = {
      email: 'someone@example.com',
      password: 'supersecret'
    };

    before(async () => {
      try {
        await app.service('users').create(userInfo);
      } catch (error) {
        // Do nothing, it just means the user already exists and can be tested
      }
    });

    it('authenticates user and creates accessToken', async () => {
      const response = await app.service('authentication/users').create({
        strategy: 'local',
        ...userInfo
      }, {});

      const {user, accessToken, authentication} = response;


      assert.ok(accessToken, 'Created access token for user');
      assert.ok(user, 'Includes user in authentication data');

      const {payload} = authentication;
      const {role} = payload;
      assert.ok(role === 'user', 'A token for user role is created.');

    }).timeout(60000);
  });
});
