// src/api/TenantServiceFactory.ts
import { MySQLTenantStorage } from './MySQLTenantStorage';
import { FileTenantStorage } from './FileTenantStorage';
import { ITenantStorage } from './ITenantStorage';

export class TenantServiceFactory {
    static createTenantService(): ITenantStorage {
        const storageType = process.env.STORAGE_TYPE || 'file';
        switch (storageType) {
            case 'mysql':
                return new MySQLTenantStorage();
            case 'file':
            default:
                return new FileTenantStorage();
        }
    }
}