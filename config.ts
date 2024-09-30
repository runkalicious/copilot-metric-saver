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
  DB_PORT
} = process.env;

// 检查 STORAGE_TYPE 是否为 'mysql'，如果是，则检查数据库连接参数
if (STORAGE_TYPE === 'mysql') {
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE || !DB_PORT) {
    throw new Error('When STORAGE_TYPE is set to "mysql", DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, and DB_PORT must be set.');
  }
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