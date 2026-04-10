import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/database";

class UserService extends Model {
  declare id: number;
  declare userId: number;
  declare serviceId: number;
}

UserService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "services",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "User_Services",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "serviceId"],
      },
    ],
  }
);

export default UserService;