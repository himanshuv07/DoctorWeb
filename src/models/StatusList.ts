// models/StatusList.ts

import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../lib/database";

interface StatusListAttributes {
  id?: number;
  name: string;
  createdBy: number;
  updatedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type StatusListCreationAttributes = Optional<
  StatusListAttributes,
  "id" | "updatedBy"
>;

class StatusList
  extends Model<StatusListAttributes, StatusListCreationAttributes>
  implements StatusListAttributes
{
  declare id: number;
  declare name: string;
  declare createdBy: number;
  declare updatedBy: number | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

// ✅ INIT
StatusList.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "statusList",
    timestamps: true,
    paranoid: true,
  }
);

// ✅ ASSOCIATIONS
export const associateStatusList = (models: any) => {
  StatusList.belongsTo(models.User, {
    as: "creater",
    foreignKey: "createdBy",
  });

  StatusList.belongsTo(models.User, {
    as: "updater",
    foreignKey: "updatedBy",
  });

//   StatusList.hasMany(models.Appointment, {
//     foreignKey: "statusId",
//   });
};

export default StatusList;