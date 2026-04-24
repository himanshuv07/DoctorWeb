// models/DoctorDetails.ts

import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../lib/database";

interface DoctorDetailsAttributes {
  id?: number;
  userId: number;

  isMon?: boolean;
  monStarttime?: string;
  monEndtime?: string;

  isTues?: boolean;
  tuesStarttime?: string;
  tuesEndtime?: string;

  isWed?: boolean;
  wedStarttime?: string;
  wedEndtime?: string;

  isThurs?: boolean;
  thursStarttime?: string;
  thursEndtime?: string;

  isFri?: boolean;
  friStarttime?: string;
  friEndtime?: string;

  isSat?: boolean;
  satStarttime?: string;
  satEndtime?: string;

  isSun?: boolean;
  sunStarttime?: string;
  sunEndtime?: string;

  createdBy?: number;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type DoctorDetailsCreationAttributes = Optional<
  DoctorDetailsAttributes,
  "id" | "updatedBy"
>;

class DoctorDetails
  extends Model<DoctorDetailsAttributes, DoctorDetailsCreationAttributes>
  implements DoctorDetailsAttributes
{
  declare id: number;
  declare userId: number;

  declare isMon: boolean;
  declare monStarttime: string;
  declare monEndtime: string;

  declare isTues: boolean;
  declare tuesStarttime: string;
  declare tuesEndtime: string;

  declare isWed: boolean;
  declare wedStarttime: string;
  declare wedEndtime: string;

  declare isThurs: boolean;
  declare thursStarttime: string;
  declare thursEndtime: string;

  declare isFri: boolean;
  declare friStarttime: string;
  declare friEndtime: string;

  declare isSat: boolean;
  declare satStarttime: string;
  declare satEndtime: string;

  declare isSun: boolean;
  declare sunStarttime: string;
  declare sunEndtime: string;

  declare createdBy: number;
  declare updatedBy: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

// ✅ INIT
DoctorDetails.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    isMon: { type: DataTypes.BOOLEAN, defaultValue: false },
    monStarttime: { type: DataTypes.TIME },
    monEndtime: { type: DataTypes.TIME },

    isTues: { type: DataTypes.BOOLEAN, defaultValue: false },
    tuesStarttime: { type: DataTypes.TIME },
    tuesEndtime: { type: DataTypes.TIME },

    isWed: { type: DataTypes.BOOLEAN, defaultValue: false },
    wedStarttime: { type: DataTypes.TIME },
    wedEndtime: { type: DataTypes.TIME },

    isThurs: { type: DataTypes.BOOLEAN, defaultValue: false },
    thursStarttime: { type: DataTypes.TIME },
    thursEndtime: { type: DataTypes.TIME },

    isFri: { type: DataTypes.BOOLEAN, defaultValue: false },
    friStarttime: { type: DataTypes.TIME },
    friEndtime: { type: DataTypes.TIME },

    isSat: { type: DataTypes.BOOLEAN, defaultValue: false },
    satStarttime: { type: DataTypes.TIME },
    satEndtime: { type: DataTypes.TIME },

    isSun: { type: DataTypes.BOOLEAN, defaultValue: false },
    sunStarttime: { type: DataTypes.TIME },
    sunEndtime: { type: DataTypes.TIME },

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
    tableName: "doctorDetails",
    timestamps: true,
    paranoid: true,
  }
);

// ✅ ASSOCIATIONS
export const associateDoctorDetails = (models: any) => {
  DoctorDetails.belongsTo(models.User, {
    foreignKey: "userId",
    as: "Doctor",
    onDelete: "CASCADE",
  });

  models.User.hasOne(DoctorDetails, {
    foreignKey: "userId",
    as: "DoctorDetails",
  });

  DoctorDetails.belongsTo(models.User, {
    as: "creater",
    foreignKey: "createdBy",
  });

  DoctorDetails.belongsTo(models.User, {
    as: "updater",
    foreignKey: "updatedBy",
  });
};

export default DoctorDetails;