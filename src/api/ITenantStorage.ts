// src/api/ITenantStorage.ts
import { Tenant } from '../model/Tenant';

export interface ITenantStorage {
    saveTenantData(tenant: Tenant): Promise<boolean>;
    getTenantData(): Promise<Tenant[]>;
    queryTenantData(name: string): Promise<Tenant | undefined>;
    getActiveTenants(): Promise<{ scopeType: string, scopeName: string }[]>;
    removeTenantData(tenant: Tenant): Promise<boolean>;
}