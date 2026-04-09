import sequelize from "../lib/database";
import Customer from "./Customer";
import User, { associateUser } from "./User";
import Duration from "./duration"; // ✅ import only
import Service, { associateService } from "./services";

// ✅ Register models
const models: any = {
  sequelize,
  Customer,
  User,
  Service,
  Duration, // ✅ add this
};

// ✅ CALL ASSOCIATIONS
associateUser(models);
associateService(models);
Duration.associate(models); // ✅ FIXED

export { sequelize, Customer, User, Service, Duration };
export default models;