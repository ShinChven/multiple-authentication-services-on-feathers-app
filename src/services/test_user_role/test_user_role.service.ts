// Initializes the `test_user_role` service on path `/test-user-role`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { TestUserRole } from './test_user_role.class';
import hooks from './test_user_role.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'test-user-role': TestUserRole & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/test-user-role', new TestUserRole(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('test-user-role');

  service.hooks(hooks);
}
