import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/database";

interface UserAttributes {
  id?: number;
  fname: string;
  lname: string;
  phone: string;
  email: string;
  password: string;
  gender: "male" | "female";
  role: "doctor" | "staff" | "admin";
  address?: string;
  isActive?: boolean;
  deletedAt?: Date | null;
}

class User extends Model<UserAttributes> implements UserAttributes {
  declare id: number;
  declare fname: string;
  declare lname: string;
  declare phone: string;
  declare email: string;
  declare password: string;
  declare gender: "male" | "female";
  declare role: "doctor" | "staff" | "admin";
  declare address: string;
  declare isActive: boolean;
  declare deletedAt: Date | null;

  // 👇 Optional (for TS autocomplete)
  declare Services?: any[];
}

// ✅ INIT (ONLY schema here)
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fname: { type: DataTypes.STRING, allowNull: false },
    lname: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.ENUM("male", "female"), allowNull: false },
    role: { type: DataTypes.ENUM("doctor", "staff", "admin"), allowNull: false },
    address: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    paranoid: true,
  }
);

// ✅ ASSOCIATIONS (OUTSIDE init)
export const associateUser = (models: any) => {
  User.belongsToMany(models.Service, {
    through: "User_Services",
    foreignKey: "userId",
    otherKey: "serviceId",
    as: "Services",
  });
  
  // User.hasOne(models.DoctorDetails, {
  //   foreignKey: "userId",
  //   as: "DoctorDetail1",
  //   onDelete: "CASCADE",
  // });
};

export default User;