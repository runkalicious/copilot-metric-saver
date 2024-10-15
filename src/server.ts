// src/server.ts
import express from 'express';
import { CopilotServiceFactory } from './api/CopilotServiceFactory'; //for both usage and seat service
import cors from 'cors';
import { Tenant } from './model/Tenant';
import { TenantServiceFactory } from './api/TenantServiceFactory'; // Import TenantServiceFactory
import { ITenantStorage } from './api/ITenantStorage'; // Import ITenantStorage
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

let usageService: any; // Declare usageService in a broader scope

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// Swagger configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Github Copilot saver API',
            version: '1.0.0',
            description: 'API documentation for Copiot usage and seat management',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
    },
    apis: ['./src/server.ts'], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/:scopeType/:scopeName/copilot/usage:
 *   get:
 *     summary: Get usage data for a tenant
 *     parameters:
 *       - in: path
 *         name: scopeType
 *         schema:
 *           type: string
 *         required: true
 *         description: The scope type (organization, team, or enterprise)
 *       - in: path
 *         name: scopeName
 *         schema:
 *           type: string
 *         required: true
 *         description: The scope name
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *         required: false
 *         description: Start date for the usage data
 *       - in: query
 *         name: until
 *         schema:
 *           type: string
 *         required: false
 *         description: End date for the usage data
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer token for authentication
 *     responses:
 *       200:
 *         description: A list of usage data
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Error fetching metrics from storage
 */

/**
 * @swagger
 * /api/:scopeType/:scopeName/copilot/billing/seats:
 *   get:
 *     summary: Get seat data for a tenant
 *     parameters:
 *       - in: path
 *         name: scopeType
 *         schema:
 *           type: string
 *         required: true
 *         description: The scope type (organization, team, or enterprise)
 *       - in: path
 *         name: scopeName
 *         schema:
 *           type: string
 *         required: true
 *         description: The scope name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer token for authentication
 *     responses:
 *       200:
 *         description: A list of seat data
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Error fetching metrics from storage
 */

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all active tenants
 *     responses:
 *       200:
 *         description: A list of active tenants
 *       500:
 *         description: Error reading active tenant data
 */

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Add a new tenant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scopeType:
 *                 type: string
 *                 description: The scope type (organization, team, or enterprise)
 *               scopeName:
 *                 type: string
 *                 description: The scope name
 *               token:
 *                 type: string
 *                 description: The token for authentication
 *               isActive:
 *                 type: boolean
 *                 description: Whether the tenant is active
 *     responses:
 *       201:
 *         description: Tenant added successfully
 *       400:
 *         description: Missing required parameters or invalid data
 *       500:
 *         description: Error adding tenant
 */

// Define the job, then run scheduled job every 12 hours
const runJob = async () => {
    // Get current time, and log it. It should be date and time, local time
    console.log('Running a job at ', new Date());

    try {
        // Use TenantServiceFactory to create the appropriate ITenantStorage implementation
        const tenantStorage: ITenantStorage = TenantServiceFactory.createTenantService();
        // Call getTenantData method to get all tenants
        const tenants: Tenant[] = await tenantStorage.getTenantData();
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

// Call metrics service for a tenant
app.get('/api/:scopeType/:scopeName/copilot/usage', async (req, res) => {
    try {
        let { scopeType, scopeName } = req.params;
        const { since, until, page = 1, per_page = 60 } = req.query;
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Bearer token
        //console.log('token:', token);
        console.log('scopeType:', scopeType);
        console.log('scopeName:', scopeName);

        if (!scopeType || !scopeName || !token) {
            return res.status(400).send('Missing required parameters: scopeType, scopeName, token');
        }

         // Convert scopeType to lowercase
         scopeType = scopeType.toLowerCase();

         if (scopeType === 'orgs') {
             scopeType = 'organization';
         } else if (scopeType === 'enterprises') {
             scopeType = 'enterprise';
         }
        // if the scopeType not within the list, return 400
        if (scopeType !== 'organization' && scopeType !== 'team' && scopeType !== 'enterprise') {
            return res.status(400).send('Invalid scopeType. It should be organization, team, or enterprise');
        }

        // Create tenant object from parameters
        const tenant = new Tenant(scopeType as 'organization' | 'team' | 'enterprise', scopeName as string, token as string, true);
        // Validate the tenant before continue
        await tenant.validateTenant();

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

// get seat for a tenant
app.get('/api/:scopeType/:scopeName/copilot/billing/seats', async (req, res) => {
    try {
        let { scopeType, scopeName } = req.params;
       // const { since, until, page = 1, per_page = 60 } = req.query;
        const {  page = 1, per_page = 60 } = req.query;
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Bearer token

        if (!scopeType || !scopeName || !token) {
            return res.status(400).send('Missing required parameters: scopeType, scopeName, token');
        }
        // if the scopeType is 'orgs', update the scopeType to 'organization'
        // Convert scopeType to lowercase
        scopeType = scopeType.toLowerCase();

        if (scopeType === 'orgs') {
            scopeType = 'organization';
        } else if (scopeType === 'enterprises') {
            scopeType = 'enterprise';
        }
        // if the scopeType not within the list, return 400

        if (scopeType !== 'organization' && scopeType !== 'team' && scopeType !== 'enterprise') {
            return res.status(400).send('Invalid scopeType. It should be organization, team, or enterprise');
        }
        // Create tenant object from parameters
        const tenant = new Tenant(scopeType as 'organization' | 'team' | 'enterprise', scopeName as string, token as string, true);

        // Validate the tenant before continue
        await tenant.validateTenant();

        // Creat a tenantservice to save the tenant data
        const tenantService = TenantServiceFactory.createTenantService();

        // save the tenant data
        // TBD: should we save the tenant data here? it is better to save it when the tenant is created. and tell the user the tenant will be saved. or it will be secure issue?
        // TBD: at least, we need a swith to control the save tenant data, so the user can choose to save the tenant data or not.
        await tenantService.saveTenantData(tenant);

        // Initialize UsageService with the tenant
        const seatService = await CopilotServiceFactory.createSeatService(tenant);

        // Call the saveUsageData method
        await seatService.saveSeatData();

        // Query usage data will get all the data,so we will call anothere method to get the latest data
       // const data = await seatService.querySeatData(since as string, until as string, parseInt(page as string), parseInt(per_page as string));
        const data = await seatService.getSeatData(parseInt(page as string), parseInt(per_page as string));
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
        // Call getActiveTenants method
        const activeTenants = await tenantStorage.getActiveTenants();
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

        res.status(201).send(`Tenant ${tenant.scopeName} added successfully`);
        
    } catch (error) {
        console.error('Error adding tenant:', error);
        res.status(500).send('Error adding tenant');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});