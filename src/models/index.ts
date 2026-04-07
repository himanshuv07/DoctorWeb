import sequelize from "../lib/database";
import Customer from "./Customer";
import User, { associateUser } from "./User";
import Service, { associateService } from "./services";

// ✅ Register models
const models: any = {
  sequelize,
  Customer,
  User,
  Service,
};

// ✅ CALL ASSOCIATIONS (🔥 THIS WAS MISSING)
associateUser(models);
associateService(models);

export { sequelize, Customer, User, Service };
export default models;