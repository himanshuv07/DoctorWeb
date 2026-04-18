import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/lib/database";

// 🔹 Attributes
interface ClinicAttributes {
    id: number;
    clinicName: string;
    logo?: string | null;
    startDay: string;
    leaveDays?: string[] | null;

    smtpUsername?: string | null;
    smtpPassword?: string | null;
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpTls?: boolean | null;

    timezone?: string;

    createdBy: number;
    updatedBy?: number | null;

    createdAt?: Date;
    updatedAt?: Date;
}

// 🔹 Creation Attributes (optional fields during create)
type ClinicCreationAttributes = Optional<
    ClinicAttributes,
    | "id"
    | "logo"
    | "leaveDays"
    | "smtpUsername"
    | "smtpPassword"
    | "smtpHost"
    | "smtpPort"
    | "smtpTls"
    | "timezone"
    | "updatedBy"
    | "createdAt"
    | "updatedAt"
>;

// 🔹 Model Class
class ClinicsSetting
    extends Model<ClinicAttributes, ClinicCreationAttributes>
    implements ClinicAttributes {
    public id!: number;
    public clinicName!: string;
    public logo!: string | null;
    public startDay!: string;
    public leaveDays!: string[] | null;

    public smtpUsername!: string | null;
    public smtpPassword!: string | null;
    public smtpHost!: string | null;
    public smtpPort!: number | null;
    public smtpTls!: boolean | null;

    public timezone!: string;

    public createdBy!: number;
    public updatedBy!: number | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // ✅ MOVE INSIDE CLASS
    static associate(models: any) {
        ClinicsSetting.belongsTo(models.User, {
            foreignKey: "createdBy",
            as: "creator",
        });

        ClinicsSetting.belongsTo(models.User, {
            foreignKey: "updatedBy",
            as: "updater",
        });
    }
}

// 🔹 Init
ClinicsSetting.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        clinicName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Dental Clinic",
        },

        logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        startDay: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "Monday",
        },

        leaveDays: {
            type: DataTypes.JSON, 
            allowNull: true,
        },

        smtpUsername: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        smtpPassword: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        smtpHost: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        smtpPort: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        smtpTls: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },

        timezone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "Asia/Kolkata",
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
        modelName: "Clinics_Setting",
        tableName: "Clinics_Setting",
        timestamps: true,
    }
);

export default ClinicsSetting;