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

            // Check if the tenant already exists
            const existingTenantIndex = tenants.findIndex((t: Tenant) => t.scopeName === tenant.scopeName);
            if (existingTenantIndex !== -1) {
                // Update existing tenant
                tenants[existingTenantIndex] = tenant;
                console.log(`Tenant ${tenant.scopeName} updated.`);
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
     async getActiveTenants(): Promise<{ scopeType: string, scopeName: string }[]> {
        try {
            const tenants = await this.getTenantData();
            return tenants
                .filter((tenant: Tenant) => tenant.isActive)
                .map((tenant: Tenant) => ({ scopeType: tenant.scopeType, scopeName: tenant.scopeName }));
        } catch (error) {
            console.error('Error reading active tenant scopes from file:', error);
            return [];
        }
    }
}