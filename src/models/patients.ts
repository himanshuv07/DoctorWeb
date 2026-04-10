import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/database";

interface PatientAttributes {
  id?: number;
  fname: string;
  lname: string;
  phone: string;
  email: string;
  gender: string;
  country: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  createdBy: number;
  updatedBy?: number | null;
  deletedAt?: Date | null;
}

class Patient extends Model<PatientAttributes> implements PatientAttributes {
  declare id: number;
  declare fname: string;
  declare lname: string;
  declare phone: string;
  declare email: string;
  declare gender: string;
  declare country: string;
  declare address1: string;
  declare address2: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare createdBy: number;
  declare updatedBy: number | null;
  declare deletedAt: Date | null;

  static associate(models: any) {
    Patient.belongsTo(models.User, {
      as: "creater",
      foreignKey: "createdBy",
    });

    Patient.belongsTo(models.User, {
      as: "updater",
      foreignKey: "updatedBy",
    });
  }
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "patients",
    timestamps: true,
    paranoid: true,
  }
);

export default Patient;