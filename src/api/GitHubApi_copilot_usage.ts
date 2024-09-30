import axios from 'axios';
import { Metrics } from '../model/Metrics';
import { Tenant } from '../model/Tenant';

export class GitHubApi {
  private tenant: Tenant;
  private team?: string;

  constructor(tenant: Tenant, team?: string) {
    if (!tenant.isActive) {
      throw new Error("Inactive tenant cannot be used for API operations.");
    }
    this.tenant = tenant;
    this.team = team;
  }

  private getApiUrl(): string {
    return this.tenant.scopeType === 'organization'
      ? `https://api.github.com/orgs/${this.tenant.scopeName}`
      : `https://api.github.com/enterprises/${this.tenant.scopeName}`;
  }

  async getMetricsApi(): Promise<Metrics[]> {
    console.log('get metrics api called at ', new Date());
    const response = await axios.get(
      `${this.getApiUrl()}/copilot/usage`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.tenant.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    return response.data.map((item: any) => new Metrics(item));
  }

  async getTeams(): Promise<string[]> {
    const response = await axios.get(`${this.getApiUrl()}/teams`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.tenant.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    return response.data;
  }

  async getTeamMetricsApi(): Promise<Metrics[]> {
    console.log("config.github.team: " + this.team);

    if (this.team && this.team.trim() !== '') {
      const response = await axios.get(
        `${this.getApiUrl()}/team/${this.team}/copilot/usage`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${this.tenant.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      return response.data.map((item: any) => new Metrics(item));
    }

    return [];
  }
}

