// src/CopilotMetricsStorageService.ts
import { IMetricsStorage } from './IMetricsStorage';
import { CopilotMetrics } from '../model/Copilot_Metrics';
import { GitHubMetricsApi } from './GitHubApi_copilot_metrics';
import { Tenant } from '../model/Tenant';
import { childTeamEnabled } from '../../config';
// the below is for further use, when needed to convert metrics to usage
//import { MetricsToUsageConverter } from './MetricsToUsageConverter';


export class CopilotMetricsStorageService {
    private storage: IMetricsStorage;
    private gitHubApi: GitHubMetricsApi;
    private tenant: Tenant;

    constructor(storage: IMetricsStorage, tenant: Tenant) {
        this.storage = storage;
        this.gitHubApi = new GitHubMetricsApi(tenant);
        this.tenant = tenant;
    }

    public async saveMetrics(): Promise<boolean> {
        try {
            if (childTeamEnabled) {
                console.log(`childTeamEnabled is set to true, fetching Metrics data for ${this.tenant.scopeName} at `, new Date());
                return await this.saveMetricsData_withChildTeams();
            } else {
                console.log(`childTeamEnabled is set to false, fetching Metrics data for ${this.tenant.scopeName} at `, new Date());
                return await this.saveMetricsData_forTenant();
            }
        } catch (error) {
            console.error('Error saving Metrics data:', error);
            throw error;    // re-throw the error to the caller
            return false;
        }
      }

    public async saveMetricsData_forTenant(): Promise<boolean> {
        try {
            const metrics = await this.gitHubApi.getMetricsApi();
            if ((!Array.isArray(metrics))|| metrics.length === 0) {
                throw new Error('Result from github API is empty, please check your token and scopeName');
            }
            return await this.storage.saveMetrics(metrics);
        } catch (error) {
            console.error('Error saving Metrics data:', error);
            return false;
        }
    }

    // CopilotMetricsStorageService.ts
    public async saveMetricsData_withChildTeams(): Promise<boolean> {
      try {
          if (this.tenant.scopeType === 'organization' && this.tenant.team.trim() === '') 
            {
            const teams = await this.gitHubApi.getTeams();
            // fetch Metrics data for each team and save it.
            for (const team of teams) {
                const MetricsData = await this.gitHubApi.getTeamMetricsApi(team.slug);
                await this.storage.saveMetrics(MetricsData, team.slug);
                console.log(`Metrics data saved for team ${team.slug} of ${this.tenant.scopeName} at `, new Date());
            }
            // fetch Metrics data for the tenant itself and save it.
                const scopeMetricsData = await this.gitHubApi.getMetricsApi();
                await this.storage.saveMetrics(scopeMetricsData);
                console.log(`Metrics data saved for team ${this.tenant.team} of ${this.tenant.scopeName} at `, new Date());

            return true;
            } 
          else 
            {
                console.log(`it is a team scope, fetching Metrics data for team ${this.tenant.team} of ${this.tenant.scopeName} at `, new Date());
                const MetricsData = await this.gitHubApi.getMetricsApi();
                return await this.storage.saveMetrics(MetricsData);
            }
      } catch (error) {
        console.error('Error saving Metrics data:', error);
        // return the error message to the caller
        throw error;
        return false
      }
    }

    public async getMetrics(): Promise<CopilotMetrics[]> {
        try {
            return await this.storage.getMetrics();
        } catch (error) {
            console.error('Error reading Metrics data:', error);
            return [];
        }
    }

    public async queryMetrics(since?: string, until?: string, page?: number, per_page?: number): Promise<CopilotMetrics[]> {
        try {
            return await this.storage.queryMetrics(since, until, page, per_page);
        } catch (error) {
            console.error('Error querying Metrics data:', error);
            return [];
        }
    }
}