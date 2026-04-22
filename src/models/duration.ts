import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../lib/database";

interface DurationAttributes {
  id: number;
  value: number;
  createdBy: number;
  updatedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

type DurationCreationAttributes = Optional<
  DurationAttributes,
  "id" | "updatedBy" | "createdAt" | "updatedAt" | "deletedAt"
>;

class Duration
  extends Model<DurationAttributes, DurationCreationAttributes>
  implements DurationAttributes
{
  declare id: number;
  declare value: number;
  declare createdBy: number;
  declare updatedBy: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;

  static associate(models: any) {
    Duration.hasMany(models.Service, {
      foreignKey: "durationId",
      as: "services",
    });
  }
}

Duration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    value: {
      type: DataTypes.INTEGER,
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
    tableName: "durations",
    timestamps: true,
    paranoid: true,
  }
);

export default Duration;