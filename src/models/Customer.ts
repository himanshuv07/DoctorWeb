// This file defines the Customer model using Sequelize, which represents the customers table in the database. It includes fields for id, name, and email, along with their respective data types and constraints. The model is then initialized and exported for use in other parts of the application.

import { DataTypes, Model } from 'sequelize';
import sequelize from '../lib/database';

interface CustomerAttributes {
  id?: number;
  name: string;
  email: string;
}

class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
  declare id: number;      // ← declare not public
  declare name: string;
  declare email: string;
}

Customer.init(
  {
    id:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:  { type: DataTypes.STRING,  allowNull: false },
    email: { type: DataTypes.STRING,  allowNull: false, unique: true },
  },
  { sequelize, tableName: 'customers', timestamps: true }
);

export default Customer;