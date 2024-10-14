// src/server.ts
import express from 'express';
import { CopilotServiceFactory } from './api/CopilotServiceFactory'; //for both usage and seat service
import cors from 'cors';
import { Tenant } from './model/Tenant';
import { TenantServiceFactory } from './api/TenantServiceFactory'; // Import TenantServiceFactory
import { ITenantStorage } from './api/ITenantStorage'; // Import ITenantStorage

let usageService: any; // Declare usageService in a broader scope

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// Define the job, then run scheduled job every 12 hours
const runJob = async () => {
    // Get current time, and log it. It should be date and time, local time
    console.log('Running a job at ', new Date());

    try {
        // Use TenantServiceFactory to create the appropriate ITenantStorage implementation
        const tenantStorage: ITenantStorage = TenantServiceFactory.createTenantService();
        // Call readTenantData method to get all tenants
        const tenants: Tenant[] = await tenantStorage.readTenantData();
        // filter out inactive tenants
        const activeTenants = tenants.filter((tenant) => tenant.isActive);

        // Iterate over each tenant and perform saveUsageData operation
        for (const tenant of activeTenants) {
            try {
                const now = new Date();
            
                // get the usage service for the tenant, and save the usage data
                const usageService = await CopilotServiceFactory.createUsageService(tenant);
                await usageService.saveUsageData();
                // Get current time and log it.
                console.log(`Metrics Data saved successfully for tenant ${tenant.scopeName} at ${now}`);

                // get the seat service for the tenant, and save the seat data
                const seatService = await CopilotServiceFactory.createSeatService(tenant);
                await seatService.saveSeatData();
                // Get current time and log it.
                console.log(`Seat Data saved successfully for tenant ${tenant.scopeName} at ${now}`);
            } catch (error) {
                const now = new Date();
                console.error(`Error saving usage data for tenant ${tenant.scopeName} at ${now}:`, error);
            }
        }
    } catch (error) {
        const now = new Date();
        console.error(`Error reading tenant data at ${now}:`, error);
    }
};

// Run it once the server starts
runJob();

// Run job every 12 hours
setInterval(runJob, 12 * 60 * 60 * 1000);

// Redirect default to /api/:scopeType/:scopeName/copilot/usage
app.get('/', (req, res) => {
    //res.redirect('/api/:scopeType/:scopeName/copilot/usage');
    res.redirect('/api/tenants');
});

// Call metrics service
app.get('/api/:scopeType/:scopeName/copilot/usage', async (req, res) => {
    try {
        const { scopeType, scopeName } = req.params;
        const { since, until, page = 1, per_page = 60 } = req.query;
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Bearer token

        if (!scopeType || !scopeName || !token) {
            return res.status(400).send('Missing required parameters: scopeType, scopeName, token');
        }

        // Create tenant object from parameters
        const tenant = new Tenant(scopeType as 'organization' | 'team' | 'enterprise', scopeName as string, token as string, true);

        // Creat a tenantservice to save the tenant data
        const tenantService = TenantServiceFactory.createTenantService();
        // save the tenant data
        await tenantService.saveTenantData(tenant);

        // Initialize UsageService with the tenant
        const usageService = await CopilotServiceFactory.createUsageService(tenant);

        // Call the saveUsageData method
        await usageService.saveUsageData();

        // Query usage data
        const data = await usageService.queryUsageData(since as string, until as string, parseInt(page as string), parseInt(per_page as string));

        // Send the data as response
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching metrics from storage');
    }
});

// Endpoint to read and print all tenant data
app.get('/api/tenants', async (req, res) => {
    try {
        // Use TenantServiceFactory to create the appropriate ITenantStorage implementation
        const tenantStorage: ITenantStorage = TenantServiceFactory.createTenantService();
        // Call readActiveTenants method
        const activeTenants = await tenantStorage.readActiveTenants();
        // Print active tenant data
        console.log('Active Tenants:', activeTenants);
        res.json(activeTenants);
    } catch (error) {
        console.error('Error reading active tenant data:', error);
        res.status(500).send('Error reading active tenant data');
    }
});


// New endpoint to add a tenant
app.post('/api/tenants', async (req, res) => {
    try {
        const { scopeType, scopeName, token, isActive } = req.body;

        if (!scopeType || !scopeName || !token) {
            return res.status(400).send('Missing required parameters: scopeType, scopeName, token');
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).send('isActive should be a boolean');
            // set the isActive to true if not provided
            //isActive = true;
        }

        // Create tenant object from request body
        const tenant = new Tenant(scopeType, scopeName, token, isActive);
        
        // Validate the tenant before saving
        await tenant.validateTenant();

        // Use TenantServiceFactory to create the appropriate ITenantStorage implementation
        const tenantStorage: ITenantStorage = TenantServiceFactory.createTenantService();
        // Save the tenant data
        await tenantStorage.saveTenantData(tenant);

        res.status(201).send('Tenant added successfully');
    } catch (error) {
        console.error('Error adding tenant:', error);
        res.status(500).send('Error adding tenant');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});