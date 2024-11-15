// src/api/IUsageStorage.ts
import { Metrics } from '../model/Copilot_Usage';
import { Tenant } from '../model/Tenant';

export interface IUsageStorage {
    initializeScope(tenant: Tenant): void;
    //saveUsageData(metrics: Metrics[]): Promise<boolean>;
    saveUsageData(metrics: Metrics[], teamSlug?: string): Promise<boolean>;
    readUsageData(): Promise<Metrics[]>;
    queryUsageData(since?: string, until?: string, page?: number, per_page?: number): Promise<Metrics[]>;
}