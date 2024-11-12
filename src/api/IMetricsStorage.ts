// src/api/IMetricsStorage.ts
import { CopilotMetrics } from '../model/Copilot_Metrics';
import { Tenant } from '../model/Tenant';

export interface IMetricsStorage {
    initializeScope(tenant: Tenant): void;
    //saveMetricsData(metrics: CopilotMetrics[]): Promise<boolean>;
    saveMetrics(metrics: CopilotMetrics[], teamSlug?: string): Promise<boolean>;
    getMetrics(teamSlug?: string): Promise<CopilotMetrics[]>;
    queryMetrics(since?: string, until?: string, page?: number, per_page?: number): Promise<CopilotMetrics[]>;
}