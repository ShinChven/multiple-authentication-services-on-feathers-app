import {HookContext, Params, ServiceAddons} from '@feathersjs/feathers';
import {authenticate, AuthenticationResult, AuthenticationService, JWTStrategy} from '@feathersjs/authentication';
import {LocalStrategy} from '@feathersjs/authentication-local';
import {expressOauth} from '@feathersjs/authentication-oauth';
import * as jwt from 'jsonwebtoken';

import {Application} from './declarations';
import {NotAuthenticated} from '@feathersjs/errors';

declare module './declarations' {
  interface ServiceTypes {
    'authentication/users': AuthenticationService & ServiceAddons<any>;
  }
}

class UsersAuthService extends AuthenticationService {
  // customizing JWT's payload
  async getPayload(authResult: AuthenticationResult, params: Params) {
    // Call original `getPayload` first
    const payload = await super.getPayload(authResult, params);
    const {user} = authResult;

    if (user) {
      payload.role = 'user'; // assign role as user
    }

    return payload;
  }
}

class ClientsAuthService extends AuthenticationService {
  // customizing JWT's payload
  async getPayload(authResult: AuthenticationResult, params: Params) {
    // Call original `getPayload` first
    const payload = await super.getPayload(authResult, params);
    const {client} = authResult;

    if (client) {
      payload.role = 'client'; // assign role as  client
    }

    return payload;
  }
}


export default function (app: Application): void {

  // Register the UsersAuthService
  const usersAuthService = new UsersAuthService(
    app,
    'authentication_users', // assign configKey so that feathers app will look for specific configuration for this authentication service
  );
  usersAuthService.register('jwt', new JWTStrategy());
  usersAuthService.register('local', new LocalStrategy());
  // Setup http path for usersAuthService
  app.use('/authentication/users', usersAuthService);

  // Register the UsersAuthService
  const clientsAuthService = new ClientsAuthService(
    app,
    'authentication_clients', // assign configKey so that feathers app will look for specific configuration for this authentication service
  );
  clientsAuthService.register('jwt', new JWTStrategy());
  clientsAuthService.register('local', new LocalStrategy());
  // Setup http path for clientsAuthService
  app.use('/authentication/clients', clientsAuthService);

  app.configure(expressOauth());
}

/**
 * authenticate hook assigned to UsersAuthService
 */
const authenticateUsers = authenticate({
  service: 'authentication/users', strategies: ['jwt']
});

/**
 * authenticate hook assigned to ClientsAuthService
 */
const authenticateClients = authenticate({
  service: 'authentication/clients', strategies: ['jwt']
});

export const authenticateHook = async (ctx: HookContext) => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const {headers = {}} = ctx.params;
    const token = headers.authorization;
    const payload = jwt.decode(token);
    // look for role in payload,
    // so that we can know which authenticate hook handles this token.
    if (payload) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const {role} = payload;
      if (role === 'user') {
        return authenticateUsers(ctx);
      } else if (role === 'client') {
        return authenticateClients(ctx);
      }
    } else { // if payload is not found, we route the authenticate call by it's path, this is mostly in login situations.
      const {path} = ctx;
      if (path === 'users') {
        return authenticateUsers(ctx);
      } else if (path === 'clients') {
        return authenticateClients(ctx);
      }
    }
  } catch (e) {
    console.error(e);
  }

  // if no routing strategy matched
  throw new NotAuthenticated('Unknown authentication service.');
};
