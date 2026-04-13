import sequelize from "../lib/database";

import Customer from "./Customer";
import User, { associateUser } from "./User";
import Duration from "./duration";
import Service, { associateService } from "./services";

// ✅ Register all models
const models: any = {
  sequelize,
  Customer,
  User,
  Duration,
  Service,
};

// ✅ IMPORTANT: Run associations AFTER all models are loaded
const setupAssociations = () => {
  // User associations (if any)
  if (associateUser) associateUser(models);

  // Service associations
  if (associateService) associateService(models);

  // Duration associations
  if (Duration.associate) Duration.associate(models);
};

// ✅ Initialize associations
setupAssociations();

export { sequelize, Customer, User, Duration, Service };
export default models;