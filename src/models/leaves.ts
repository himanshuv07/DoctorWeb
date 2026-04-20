import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database";

// 🔹 Attributes
interface LeaveAttributes {
    id: number;
    leave_startDate: string;
    leave_endDate: string;

    status?: "enabled" | "disabled" | null;

    created_by: number;
    updated_by?: number | null;
    user_id: number;

    remark?: string | null;

    deletedAt?: Date | null;

    createdAt?: Date;
    updatedAt?: Date;
}

// 🔹 Creation Attributes
type LeaveCreationAttributes = Optional<
    LeaveAttributes,
    | "id"
    | "status"
    | "updated_by"
    | "remark"
    | "deletedAt"
    | "createdAt"
    | "updatedAt"
>;

// 🔹 Model Class
class Leave
    extends Model<LeaveAttributes, LeaveCreationAttributes>
    implements LeaveAttributes {
    public id!: number;
    public leave_startDate!: string;
    public leave_endDate!: string;

    public status!: "enabled" | "disabled" | null;

    public created_by!: number;
    public updated_by!: number | null;
    public user_id!: number;

    public remark!: string | null;

    public deletedAt!: Date | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // 🔹 Associations
    static associate(models: any) {
        Leave.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "doctor",
        });

        Leave.belongsTo(models.User, {
            foreignKey: "created_by",
            as: "creator",
        });

        Leave.belongsTo(models.User, {
            foreignKey: "updated_by",
            as: "updater",
        });
    }
}

// 🔹 Init
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
            allowNull: true,
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
        modelName: "Leave",
        tableName: "Leaves",
        timestamps: true,
        paranoid: true, // enables soft delete
    }
);

export default Leave;