// This file is used to export all the models and the sequelize instance for easy import in other parts of the application.

import sequelize from '../lib/database';
import Customer from './Customer';
import User from './User';

export { sequelize, Customer, User };