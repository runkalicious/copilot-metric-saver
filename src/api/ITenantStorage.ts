// src/api/ITenantStorage.ts
import { Tenant } from '../model/Tenant';

export interface ITenantStorage {
    saveTenantData(tenant: Tenant): Promise<boolean>;
    readTenantData(): Promise<Tenant[]>;
    queryTenantData(name: string): Promise<Tenant | undefined>;
    readActiveTenants(): Promise<{ scopeType: string, scopeName: string }[]>;
}