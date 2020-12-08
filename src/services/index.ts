import { Application } from '../declarations';
import users from './users/users.service';
import clients from './clients/clients.service';
import testUserRole from './test_user_role/test_user_role.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(users);
  app.configure(clients);
  app.configure(testUserRole);
}
