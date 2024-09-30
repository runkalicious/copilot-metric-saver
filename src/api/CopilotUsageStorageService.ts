// src/CopilotUsageStorageService.ts
import { IUsageStorage } from './IUsageStorage';
import { Metrics } from '../model/Metrics';
import { GitHubApi } from './GitHubApi_copilot_usage';
import { Tenant } from '../model/Tenant';

export class CopilotUsageStorageService {
    private storage: IUsageStorage;
    private gitHubApi: GitHubApi;

    constructor(storage: IUsageStorage, tenant: Tenant, team?: string) {
        this.storage = storage;
        this.gitHubApi = new GitHubApi(tenant, team);
    }

    public async saveUsageData(): Promise<boolean> {
        try {
            const metrics = await this.gitHubApi.getMetricsApi();
            if (!Array.isArray(metrics)) {
                throw new Error('Result is not an array.');
            }
            return await this.storage.saveUsageData(metrics);
        } catch (error) {
            console.error('Error saving usage data:', error);
            return false;
        }
    }

    public async readUsageData(): Promise<Metrics[]> {
        try {
            return await this.storage.readUsageData();
        } catch (error) {
            console.error('Error reading usage data:', error);
            return [];
        }
    }

    public async queryUsageData(since?: string, until?: string, page?: number, per_page?: number): Promise<Metrics[]> {
        try {
            return await this.storage.queryUsageData(since, until, page, per_page);
        } catch (error) {
            console.error('Error querying usage data:', error);
            return [];
        }
    }
}