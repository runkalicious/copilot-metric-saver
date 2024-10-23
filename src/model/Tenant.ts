// model/Tenant.ts
import { getMetricsApi } from '../api/GitHubApi'; 

export class Tenant {
    public scopeType: 'organization' | 'enterprise';
    public scopeName: string;
    public token: string;
    public isActive: boolean;
    public team: string; // Add team property

    constructor(scopeType: 'organization' | 'enterprise', scopeName: string, token: string, team: string = '', isActive: boolean = true) {
        this.scopeType = scopeType;
        this.scopeName = scopeName;
        this.token = token;
        this.team = team; // Assign team property
        this.isActive = isActive;

        // Validate tenant using GitHub API
       // this.validateTenant();
    }

    public async validateTenant(): Promise<boolean> {
        try {
            await getMetricsApi(this.scopeType, this.scopeName, this.token);
            return true;
        } catch (error) {
            throw new Error('Invalid tenant information: scopeType, scopeName, or token is incorrect');
            return false;
        }
    }
}