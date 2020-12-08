# multiple-authentication-services-on-feathers-app

This is an example to show how to implement multiple authentication services on a FeathersJS app.  

## Prerequisites

To proceed with this tutorial you must first read the FeathersJS' documentation.

## Config Authentication Services 

### Generate 2 Authentication Services With Each Of Its Own RESTful services

```bash
feathers generate services
```

Let's generate 2 services called `users` and `clients` in this tutorial.  

### Modify Configuration File

Authentication configuration for 2 authentication services should be in 2 different key in Feathers app's configuration file.

```json
{
  "authentication_users": {
    "entity": "user",
    "service": "users",
    "secret": "******UserAuthenticationSecrets******",
    "authStrategies": [
      "jwt",
      "local"
    ],
    "jwtOptions": {
      "header": {
        "typ": "access"
      },
      "audience": "https://yourdomain.com",
      "issuer": "feathers",
      "algorithm": "HS256",
      "expiresIn": "1d"
    },
    "local": {
      "usernameField": "email",
      "passwordField": "password"
    }
  },
  "authentication_clients": {
    "entity": "client",
    "service": "clients",
    "secret": "******ClientAuthenticationSecrets******",
    "authStrategies": [
      "jwt",
      "local"
    ],
    "jwtOptions": {
      "header": {
        "typ": "access"
      },
      "audience": "https://yourdomain.com",
      "issuer": "feathers",
      "algorithm": "HS256",
      "expiresIn": "1d"
    },
    "local": {
      "usernameField": "email",
      "passwordField": "password"
    }
  }
}
```

## Setup Multiple Authentication Services

Authentication service will be setup in `src/authentication.ts`. By default, this is only 1 authentication got setup here. Let's modify this file to setup 2 authentication services here.

### Customize JWT Payload

JWT are verified in Feathers Hooks, you should know that through FeathersJS documentation.

If we're to use multiple authentication services in our Feathers app, we should consider adding a field to JWT's payload to proclaim which authentication service should handle this token.

Let's do it via customizing the authentication services

```typescript
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
```

### Register Multiple Authentication Services

Since we already have 2 customized authentication services, let's register them in `src/authentication.ts`

```typescript
export default function(app: Application): void {

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
```

### Route The Authentication Hook

JWT tokens must be authenticated by its own issuer(authentication service).

Let wrap the origin authenticate hook and route by token.

```typescript
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
    const token = ctx.params.headers.authorization;
    const payload = jwt.decode(token);
    // look for role in payload, 
    // so that we can know which authenticate hook handles this token.
    if (payload) {
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
```

### Use The Routed Authentication Hook

Let's use the routed authentication hook at where we want to authenticate multiple kinds of users.

```typescript
export default {
  before: {
    all: [],
    find: [ authenticateHook ],
    get: [ authenticate('jwt') ],
    create: [ hashPassword('password') ],
    update: [ hashPassword('password'),  authenticateHook ],
    patch: [ hashPassword('password'),  authenticateHook ],
    remove: [ authenticateHook ]
  },
// ... 
}
```
