import sequelize from "@/lib/database";
import Customer from "./Customer";
import User, { associateUser } from "./User";
import UserService from "./UserService";
import Service, { associateService } from "./Service";
import Duration from "./Duration";
import Patient from "./Patient";
import Clinics from "./clinicSetting";

const models: any = {
  sequelize,
  Customer,
  User,
  UserService,
  Service,
  Duration,
  Patient,
  Clinics,
};

// ✅ Associations
associateUser(models);
associateService(models);
Duration.associate(models);
Patient.associate(models);

// ❗ Safe call (won’t crash if not defined)
Clinics.associate(models);

export {
  sequelize,
  Customer,
  User,
  UserService,
  Service,
  Duration,
  Patient,
  Clinics,
};

export default models;