import sequelize from "../lib/database";
import Customer from "./Customer";
import User, { associateUser } from "./User";
// import Duration, { associateDuration } from "./duration"; // ✅ FIXED
import Service, { associateService } from "./services";

// ✅ Register models
const models: any = {
  sequelize,
  Customer,
  User,
  Service,
  // Duration,
};

// ✅ CALL ASSOCIATIONS
associateUser(models);
associateService(models);
// associateDuration(models); // ✅ NOW WORKS

// export { sequelize, Customer, User, Service, Duration };
export { sequelize, Customer, User, Service };
export default models;