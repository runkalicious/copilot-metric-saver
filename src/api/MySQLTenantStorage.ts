// src/api/MySQLTenantStorage.ts
import { createConnection, Connection } from 'mysql2/promise';
import { ITenantStorage } from './ITenantStorage';
import { Tenant } from '../model/Tenant';
import { storage_config } from '../../config';

export class MySQLTenantStorage implements ITenantStorage {
    private dbConnection: Connection | null = null;
    private initialized: boolean = false;

    constructor() {
        this.initConnection();
        this.initializeDatabase();
    }

    private async initConnection() {
        try {
            this.dbConnection = await createConnection({
                host: storage_config.DB?.HOST,
                user: storage_config.DB?.USER,
                password: storage_config.DB?.PASSWORD,
                database: storage_config.DB?.DATABASE,
                port: storage_config.DB?.PORT,
            });
            console.log('Database connection established successfully in tenant module.');
            this.initialized = true;
        } catch (error) {
            console.error('Error connecting to the database:', error);
            this.initialized = false;
        }
    }

    private async initializeDatabase() {
        await this.ensureInitialized();

        const createTenantsTableQuery = `
            CREATE TABLE IF NOT EXISTS tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                scopeName VARCHAR(255) NOT NULL,
                scopeType VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL,
                isActive BOOLEAN NOT NULL,
                UNIQUE KEY unique_scope_type (scopeName, scopeType)
            );
        `;

        try {
            await this.dbConnection!.execute(createTenantsTableQuery);
            console.log('Tenants table initialized.');
        } catch (error) {
            console.error('Error initializing tenants table:', error);
        }
    }

    private async ensureInitialized() {
        if (!this.initialized) {
            console.log('Re-initializing connection in tenant module...');
            await this.initConnection();
        }
    }

    async saveTenantData(tenant: Tenant): Promise<boolean> {
        await this.ensureInitialized();
        try {
            await this.dbConnection!.execute(
                'INSERT INTO tenants (scopeName, scopeType, token, isActive) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), isActive = VALUES(isActive)',
                [tenant.scopeName, tenant.scopeType, tenant.token, tenant.isActive]
            );
            return true;
        } catch (error) {
            console.error('Error saving tenant data to MySQL:', error);
            return false;
        }
    }

    async getTenantData(): Promise<Tenant[]> {
        await this.ensureInitialized();
        try {
            const [rows] = await this.dbConnection!.execute('SELECT * FROM tenants');
            return (rows as any[]).map(row => new Tenant(row.scopeType, row.scopeName, row.token, row.isActive));
        } catch (error) {
            console.error('Error reading tenant data from MySQL:', error);
            return [];
        }
    }

    async queryTenantData(name: string): Promise<Tenant | undefined> {
        await this.ensureInitialized();
        try {
            const [rows] = await this.dbConnection!.execute('SELECT * FROM tenants WHERE scopeName = ?', [name]);
            const tenants = (rows as any[]).map(row => new Tenant(row.scopeType, row.scopeName, row.token, row.isActive));
            return tenants.length > 0 ? tenants[0] : undefined;
        } catch (error) {
            console.error('Error querying tenant data from MySQL:', error);
            return undefined;
        }
    }

    async getActiveTenants(): Promise<{ scopeType: string, scopeName: string }[]> {
        await this.ensureInitialized();
        try {
            const [rows] = await this.dbConnection!.execute('SELECT scopeType, scopeName FROM tenants WHERE isActive = true');
            return rows as { scopeType: string, scopeName: string }[];
        } catch (error) {
            console.error('Error reading active tenants from MySQL:', error);
            return [];
        }
    }

    
}