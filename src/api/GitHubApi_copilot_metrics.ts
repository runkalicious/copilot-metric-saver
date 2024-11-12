import axios from 'axios';
import { CopilotMetrics } from '../model/Copilot_Metrics';
import { Tenant } from '../model/Tenant';

export class GitHubMetricsApi {
  private tenant: Tenant;
  private team?: string;

  constructor(tenant: Tenant) {
    if (!tenant.isActive) {
      throw new Error("Inactive tenant cannot be used for API operations.");
    }
    this.tenant = tenant;
    this.team = tenant.team;
  }

  private getApiUrl(): string {
    // need to checck whehter the tenant's team is set, it is set, then the url should be https://api.github.com/[scoptName]/:org/teams/:team
    if (this.team && this.team.trim() !== '') {
      return this.tenant.scopeType === 'organization'
        ? `https://api.github.com/orgs/${this.tenant.scopeName}/team/${this.team}`
        : `https://api.github.com/enterprises/${this.tenant.scopeName}/team/${this.team}`;
    }
    else {
      return this.tenant.scopeType === 'organization'
        ? `https://api.github.com/orgs/${this.tenant.scopeName}`
        : `https://api.github.com/enterprises/${this.tenant.scopeName}`;
    }

  }

  async getMetricsApi(): Promise<CopilotMetrics[]> {
    console.log(`get metrics api called for team ${this.tenant.team} of ${this.tenant.scopeName} at `, new Date());
    try {
      console.log("this.getapiurl is: " + this.getApiUrl());
      const response = await axios.get(
        `${this.getApiUrl()}/copilot/metrics`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${this.tenant.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      //check the response status, it should be 200, if not, throw an error
      if (response.status !== 200) {
        throw new Error(`Failed to get metrics from GitHub API for ${this.tenant.scopeName}`);
      }
      return response.data.map((item: any) => new CopilotMetrics(item));
    } catch (error) {
      console.error(`Error fetching metrics from GitHub API for ${this.tenant.scopeName}:`);
      
      // Construct error response object
      const errorResponse = {
        message: (error as any).response?.data?.message || 'An error occurred while fetching team metrics.',
        documentation_url: (error as any).response?.data?.documentation_url || 'https://docs.github.com/rest/copilot/copilot-metrics#get-copilot-metrics-for-a-team',
        status: (error as any).response?.status || 500
      };
      // Throw error with detailed information
      throw new Error(JSON.stringify(errorResponse));
    }
  }

  async getTeams(): Promise<{ name: string; id: number; slug: string; description: string }[]> {
    const response = await axios.get(`${this.getApiUrl()}/teams`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.tenant.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    //return response.data;
    // update to return only the team values we need
    return response.data.map((team: any) => ({
      name: team.name,
      id: team.id,
      slug: team.slug,
      description: team.description,
    }));

  }

 
  
  async getTeamMetricsApi(teamSlug: string): Promise<CopilotMetrics[]> {
    try {
      if (teamSlug && teamSlug.trim() !== '') {
        const response = await axios.get(
          `${this.getApiUrl()}/team/${teamSlug}/copilot/metrics`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${this.tenant.token}`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        );
        if (response.status !== 200) {
          throw new Error(`Failed to get team metrics from GitHub API for team ${teamSlug}, the response status is ${response.status}`);
        }
        return response.data.map((item: any) => new CopilotMetrics(item));
      } else {
        throw new Error(`No team ${teamSlug}, the team slug is empty, please check the team slug`);
      }
    } catch (error) {
     // console.error(`Error fetching team metrics from GitHub API for team ${teamSlug}:`, error as any);
      console.error(`Error fetching team metrics from GitHub API for team ${teamSlug}:`);
      
      // Construct error response object
      const errorResponse = {
        message: (error as any).response?.data?.message || 'An error occurred while fetching team metrics.',
        documentation_url: (error as any).response?.data?.documentation_url || 'https://docs.github.com/rest/copilot/copilot-metrics#get-copilot-metrics-for-a-team',
        status: (error as any).response?.status || 500
      };
  
      // Throw error with detailed information
      throw new Error(JSON.stringify(errorResponse));
    }
  }
}

