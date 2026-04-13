import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/database";

class Service extends Model {
  declare id: number;
  declare durationId: number;
  declare name: string;
  declare price: number;
  declare createdBy: number;
  declare updatedBy: number;
}

// ✅ INIT
Service.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    durationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0,
      },
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
    tableName: "services",
    timestamps: true,
    paranoid: true,
  }
);

// ✅ ASSOCIATIONS (OUTSIDE)
export const associateService = (models: any) => {
  Service.belongsTo(models.Duration, {
    foreignKey: "durationId",
    as: "duration",
  });

  Service.belongsToMany(models.User, {
    through: models.UserService,
    foreignKey: "serviceId",
    otherKey: "userId",
    as: "Users",
  });
};

export default Service;