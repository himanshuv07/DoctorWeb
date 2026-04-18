import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/database";

class Leave extends Model {
  declare id: number;

  declare leave_startDate: string;
  declare leave_endDate: string;

  declare status: "enabled" | "disabled";

  declare created_by: number;
  declare updated_by: number | null;
  declare user_id: number;

  declare remark: string | null;

  declare deletedAt: Date | null;

  // timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    Leave.belongsTo(models.User, {
      as: "doctor",
      foreignKey: "user_id",
    });

    Leave.belongsTo(models.User, {
      as: "creator", // fixed typo from "creater"
      foreignKey: "created_by",
    });

    Leave.belongsTo(models.User, {
      as: "updater",
      foreignKey: "updated_by",
    });
  }
}

Leave.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    leave_startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    leave_endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("enabled", "disabled"),
      defaultValue: "enabled",
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Leaves",
    timestamps: true,
    paranoid: true, // soft delete
  }
);

export default Leave;