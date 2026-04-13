import { DataTypes, Model } from 'sequelize';
import sequelize from '../lib/database';

class Duration extends Model {
  declare id: number;
  declare value: number;
  declare createdBy: number;
  declare updatedBy: number | null;

  // timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    Duration.belongsTo(models.User, {
      as: 'creater',
      foreignKey: 'createdBy',
    });

    Duration.belongsTo(models.User, {
      as: 'updater',
      foreignKey: 'updatedBy',
    });

    Duration.hasMany(models.Service, {
      foreignKey: 'durationId',
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
      defaultValue: 10,
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
    tableName: 'duration',
    timestamps: true,
  }
);

export default Duration;