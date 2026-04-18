import sequelize from "@/lib/database";
import ClinicsSetting from "./clinicSetting";
import Duration from "./duration";
import Patient from "./patients";
import User, { associateUser } from "./User";
import Service, { associateService } from "./services";
import UserService from "./UserServices";

const models: any = {
  sequelize,
  User, 
  UserService,
  Service,
  Duration,
  Patient,
  ClinicsSetting,
};

// Associations
associateUser(models);
associateService(models);
Duration.associate(models);
Patient.associate(models);
ClinicsSetting.associate?.(models);

export {
  sequelize,
  User,
  UserService,
  Service,
  Duration,
  Patient,
  ClinicsSetting,
};

export default models;