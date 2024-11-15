// src/api/FileTenantStorage.ts
import fs from 'fs';
import path from 'path';
import { ITenantStorage } from './ITenantStorage';
import { Tenant } from '../model/Tenant';

export class FileTenantStorage implements ITenantStorage {
    private tenantsFilePath: string;

    constructor() {
        this.tenantsFilePath = path.join(__dirname, '../../data/tenants.json');
        this.ensureFileExists();
    }

    /**
     * Ensure the tenants file exists. If not, create an empty JSON file.
     */
    private ensureFileExists() {
        if (!fs.existsSync(this.tenantsFilePath)) {
            fs.writeFileSync(this.tenantsFilePath, JSON.stringify({ tenants: [] }, null, 2));
            console.log('Tenants file created.');
        }
    }

    /**
     * Save tenant data. If the tenant already exists, update it. Otherwise, add a new tenant.
     * @param tenant The tenant data to save.
     * @returns {Promise<boolean>} True if the operation was successful, false otherwise.
     */
    async saveTenantData(tenant: Tenant): Promise<boolean> {
        try {
            const data = fs.readFileSync(this.tenantsFilePath, 'utf-8');
                const tenants = JSON.parse(data).tenants;

            if (tenants.length > 0) {
                // Check if the tenant already exists
                const existingTenantIndex = tenants.findIndex((t: Tenant) => 
                    t.scopeName.toLowerCase() === tenant.scopeName.toLowerCase() && 
                    (t.team?.toLowerCase() || '') === (tenant.team?.toLowerCase() || '') && 
                    t.scopeType.toLowerCase() === tenant.scopeType.toLowerCase()
                );
                if (existingTenantIndex !== -1) {
                    // Update existing tenant
                    tenants[existingTenantIndex] = tenant;
                    console.log(`Tenant ${tenant.scopeName} updated.`);
                } else {
                    // Add new tenant
                    tenants.push(tenant);
                    console.log(`Tenant ${tenant.scopeName} added.`);
                }
            } else {
                // Add new tenant
                tenants.push(tenant);
                console.log(`Tenant ${tenant.scopeName} added.`);
            }

            //console.log('tenants:', tenants);
            // Write only the updated or new tenant back to the file
            // I think there is a bug here, because it just write all tenants back to the file, not only the updated or new tenant,plese check and fix it.
            fs.writeFileSync(this.tenantsFilePath, JSON.stringify({ tenants }, null, 2));

            return true;
        } catch (error) {
            console.error('Error saving tenant data to file:', error);
            return false;
        }
    }

    /**
     * Read all tenant data from the file.
     * @returns {Promise<Tenant[]>} An array of tenant data.
     */
    async getTenantData(): Promise<Tenant[]> {
        try {
            const data = fs.readFileSync(this.tenantsFilePath, 'utf-8');
            return JSON.parse(data).tenants;
        } catch (error) {
            console.error('Error reading tenant data from file:', error);
            return [];
        }
    }

    /**
     * Query tenant data by scope name.
     * @param name The scope name of the tenant to query.
     * @returns {Promise<Tenant | undefined>} The tenant data if found, undefined otherwise.
     */
    async queryTenantData(name: string): Promise<Tenant | undefined> {
        try {
            const tenants = await this.getTenantData();
            return tenants.find(tenant => tenant.scopeName === name);
        } catch (error) {
            console.error('Error querying tenant data from file:', error);
            return undefined;
        }
    }

     /**
     * Read active tenant scopes from the file.
     * @returns {Promise<{ scopeType: string, scopeName: string }[]>} An array of active tenant scopes.
     */
     async getActiveTenants(): Promise<{ scopeType: string, scopeName: string ,team: string}[]> {
        try {
            const tenants = await this.getTenantData();
            if (tenants.length === 0) {
                return [];
            }
            else{
            return tenants
                .filter((tenant: Tenant) => tenant.isActive)
                .map((tenant: Tenant) => ({ scopeType: tenant.scopeType, scopeName: tenant.scopeName , team: tenant.team}));
            }    
            } 
            catch (error) {
            console.error('Error reading active tenant scopes from file:', error);
            return [];
        }
    }

    /**
     * Remove tenant data.
     * @param tenant The tenant data to remove.
     * @returns {Promise<boolean>} True if the operation was successful, false otherwise.
     */
    async removeTenantData(tenant: Tenant): Promise<boolean> {
        try {
            const data = fs.readFileSync(this.tenantsFilePath, 'utf-8');
            const tenants = JSON.parse(data).tenants;

            // Find the index of the tenant to remove
           // const tenantIndex = tenants.findIndex((t: Tenant) => t.scopeName === tenant.scopeName && t.scopeType === tenant.scopeType && t.team === tenant.team);
            const tenantIndex = tenants.findIndex((t: Tenant) => 
                t.scopeName.toLowerCase() === tenant.scopeName.toLowerCase() && 
                (t.team?.toLowerCase() || '') === (tenant.team?.toLowerCase() || '') && 
                t.scopeType.toLowerCase() === tenant.scopeType.toLowerCase()
            );
            if (tenantIndex !== -1) {
                // Remove the tenant. maybe it is better to update its 'isActive' property to false instead of removing it.
                tenants.splice(tenantIndex, 1);
                console.log(`Tenant ${tenant.scopeName} removed.`);
            }

            // Write the updated tenant list back to the file
            fs.writeFileSync(this.tenantsFilePath, JSON.stringify({ tenants }, null, 2));

            return true;
        } catch (error) {
            console.error('Error removing tenant data from file:', error);
            return false;
        }
    }
}