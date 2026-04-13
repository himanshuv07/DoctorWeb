import sequelize from "../lib/database";
import Customer from "./patients";
import User, { associateUser } from "./User";
import UserService from "./UserServices";
import Duration from "./duration";
import Service, { associateService } from "./services";
import Patient from "./patients";

const models: any = {
  sequelize,
  Customer,
  User,
  UserService,
  Service,
  Duration,
  Patient,
};

associateUser(models);
associateService(models);
Duration.associate(models);
Patient.associate(models);

export { sequelize, Customer, User, UserService, Service, Duration, Patient };
export default models;