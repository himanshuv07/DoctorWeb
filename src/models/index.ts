import sequelize from "@/lib/database";
import ClinicsSetting from "./clinicSetting";
import Duration from "./duration";
import Patient from "./patients";
import User, { associateUser } from "./User";
import Service, { associateService } from "./services";
import UserService from "./UserServices";
import Leave from "./leaves";

const models: any = {
  sequelize,
  User, 
  UserService,
  Service,
  Duration,
  Patient,
  ClinicsSetting,
  Leave,
};

// Associations
associateUser(models);
associateService(models);
Duration.associate(models);
Patient.associate(models);
ClinicsSetting.associate?.(models);
Leave.associate?.(models);

export {
  sequelize,
  User,
  UserService,
  Service,
  Duration,
  Patient,
  ClinicsSetting,
  Leave,
};

export default models;