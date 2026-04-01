// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../lib/database';

// interface CustomerAttributes {
//   id?: number;
//   name: string;
//   email: string;
// }

// class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
//   public id!: number;
//   public name!: string;
//   public email!: string;
// }

// Customer.init(
//   {
//     id:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//     name:  { type: DataTypes.STRING,  allowNull: false },
//     email: { type: DataTypes.STRING,  allowNull: false, unique: true },
//   },
//   { sequelize, tableName: 'customers', timestamps: true }
// );

// export default Customer;

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