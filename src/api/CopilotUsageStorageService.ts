// src/CopilotUsageStorageService.ts
import { IUsageStorage } from './IUsageStorage';
import { Metrics } from '../model/Metrics';
import { GitHubApi } from './GitHubApi_copilot_usage';
import { Tenant } from '../model/Tenant';
import { childTeamEnabled } from '../../config';

export class CopilotUsageStorageService {
    private storage: IUsageStorage;
    private gitHubApi: GitHubApi;
    private tenant: Tenant;

    constructor(storage: IUsageStorage, tenant: Tenant) {
        this.storage = storage;
        this.gitHubApi = new GitHubApi(tenant);
        this.tenant = tenant;
    }

    public async saveUsageData(): Promise<boolean> {
        if (childTeamEnabled) {
          return await this.saveUsageData_withChildTeams();
        } else {
          return await this.saveUsageData_forTenant();
        }
      }

    public async saveUsageData_forTenant(): Promise<boolean> {
        try {
            const metrics = await this.gitHubApi.getMetricsApi();
            if ((!Array.isArray(metrics))|| metrics.length === 0) {
                throw new Error('Result from github API is empty, please check your token and scopeName');
            }
            return await this.storage.saveUsageData(metrics);
        } catch (error) {
            console.error('Error saving usage data:', error);
            return false;
        }
    }

    // CopilotUsageStorageService.ts
    public async saveUsageData_withChildTeams(): Promise<boolean> {
      try {
          if (this.tenant.scopeType === 'organization' && this.tenant.team.trim() === '') 
            {
            const teams = await this.gitHubApi.getTeams();
            // fetch usage data for each team and save it.
            for (const team of teams) {
                const usageData = await this.gitHubApi.getTeamMetricsApi(team.slug);
                await this.storage.saveUsageData(usageData, team.slug);
                console.log(`Usage data saved for team ${team.slug} of ${this.tenant.scopeName} at `, new Date());
            }
            // fetch usage data for the organization itself and save it.
                const scopeUsageData = await this.gitHubApi.getMetricsApi();
                await this.storage.saveUsageData(scopeUsageData);
                console.log(`Usage data saved for team ${this.tenant.team} of ${this.tenant.scopeName} at `, new Date());

            return true;
            } 
            else 
            {
                const usageData = await this.gitHubApi.getMetricsApi();
                return await this.storage.saveUsageData(usageData);
            }
      } catch (error) {
        console.error('Error saving usage data:', error);
        return false
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