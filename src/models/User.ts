// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../lib/database';

// interface UserAttributes {
//   id?: number;
//   email: string;
//   password: string;
// }

// class User extends Model<UserAttributes> implements UserAttributes {
//   public id!: number;
//   public email!: string;
//   public password!: string;
// }

// User.init(
//   {
//     id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//     email:    { type: DataTypes.STRING,  allowNull: false, unique: true },
//     password: { type: DataTypes.STRING,  allowNull: false },
//   },
//   { sequelize, tableName: 'users', timestamps: true }
// );

// export default User;


import { DataTypes, Model } from 'sequelize';
import sequelize from '../lib/database';

interface UserAttributes {
  id?: number;
  email: string;
  password: string;
}

class User extends Model<UserAttributes> implements UserAttributes {
  declare id: number;       // ← declare instead of public
  declare email: string;
  declare password: string;
}

User.init(
  {
    id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email:    { type: DataTypes.STRING,  allowNull: false, unique: true },
    password: { type: DataTypes.STRING,  allowNull: false },
  },
  { sequelize, tableName: 'users', timestamps: true }
);

export default User;