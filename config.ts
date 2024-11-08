import dotenv from 'dotenv';

// load environment variables from .env file
dotenv.config();

// get environment variables from process.env
const {
  STORAGE_TYPE,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
  CHILD_TEAM_ENABLED,
  TENANT_AUTO_SAVE
} = process.env;

// to check whether STORAGE_TYPE is  'mysql'，it it is, need to check the database related parameters.
if (STORAGE_TYPE === 'mysql') {
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE || !DB_PORT) {
    throw new Error('When STORAGE_TYPE is set to "mysql", DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, and DB_PORT must be set.');
  }
}

// Validate CHILD_TEAM_ENABLED and TENANT_AUTO_SAVE
const validBooleanValues = ['true', 'false'];
if (CHILD_TEAM_ENABLED && !validBooleanValues.includes(CHILD_TEAM_ENABLED.toLowerCase())) {
  throw new Error('CHILD_TEAM_ENABLED must be either "true" or "false" (case insensitive).');
}
if (TENANT_AUTO_SAVE && !validBooleanValues.includes(TENANT_AUTO_SAVE.toLowerCase())) {
  throw new Error('TENANT_AUTO_SAVE must be either "true" or "false" (case insensitive).');
}

// Set up a class named Config to store the configuration,it includes a column called storage_type, and optional columns for database connection parameters.

export class Storage_Config {
  storage_type: string;
  DB?: {
    HOST?: string;
    USER?: string;
    PASSWORD?: string;
    DATABASE?: string;
    PORT?: number;
  };

  constructor() {
    this.storage_type = STORAGE_TYPE || 'file';
    if (this.storage_type === 'mysql') {
      this.DB = {
        HOST: DB_HOST,
        USER: DB_USER,
        PASSWORD: DB_PASSWORD,
        DATABASE: DB_DATABASE,
        PORT: DB_PORT ? parseInt(DB_PORT) : undefined,
      };
    }
  }
}

// Export a constant instance of Storage_Config
export const storage_config = new Storage_Config();

// Export CHILD_TEAM_ENABLED and TENANT_AUTO_SAVE as boolean values
export const childTeamEnabled = CHILD_TEAM_ENABLED === 'true';
export const tenantAutoSave = TENANT_AUTO_SAVE === 'true';
