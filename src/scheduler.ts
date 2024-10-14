import { CopilotServiceFactory } from './api/CopilotServiceFactory';

const usageService = CopilotServiceFactory.createUsageService();

// run job every 10 minutes
setInterval(async () => {
    console.log('Running a job every 10 minutes');
    try {
        await usageService.saveUsageData();
        // get the current date and time
        const now = new Date();
        console.log(`Data saved successfully at ${now}`);
    } catch (error) {
        const now = new Date();
        console.error(`Error saving usage data at ${now}:`, error);
    }
}, 10 * 60 * 1000); // time interval in milliseconds