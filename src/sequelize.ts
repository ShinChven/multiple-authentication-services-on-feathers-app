import { Sequelize } from 'sequelize';
import { Application } from './declarations';
import {realPath} from './root-path';

export default function (app: Application): void {
  const connectionString = `sqlite://${realPath(app.get('sqlite'))}`;
  const sequelize = new Sequelize(connectionString, {
    dialect: 'sqlite',
    logging: false,
    define: {
      freezeTableName: true
    }
  });
  const oldSetup = app.setup;

  app.set('sequelizeClient', sequelize);

  app.setup = function (...args): Application {
    const result = oldSetup.apply(this, args);

    // Set up data relationships
    const models = sequelize.models;
    Object.keys(models).forEach(name => {
      if ('associate' in models[name]) {
        (models[name] as any).associate(models);
      }
    });

    // Sync to the database
    app.set('sequelizeSync', sequelize.sync());

    return result;
  };
}
