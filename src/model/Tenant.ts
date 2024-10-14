// model/Tenant.ts
import { getMetricsApi } from '../api/GitHubApi'; 

export class Tenant {
    public scopeType: 'organization' | 'team' | 'enterprise';
    public scopeName: string;
    public token: string;
    public isActive: boolean;

    constructor(scopeType: 'organization' | 'team' | 'enterprise', scopeName: string, token: string, isActive: boolean = true) {
        this.scopeType = scopeType;
        this.scopeName = scopeName;
        this.token = token;
        this.isActive = isActive;

        // Validate tenant using GitHub API
       // this.validateTenant();
    }

    public async validateTenant(): Promise<void> {
        try {
            await getMetricsApi(this.scopeType, this.scopeName, this.token);
        } catch (error) {
            throw new Error('Invalid tenant information: scopeType, scopeName, or token is incorrect');
        }
    }
}