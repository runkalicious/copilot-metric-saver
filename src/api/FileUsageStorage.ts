import * as fs from 'fs';
import path from 'path';
import { CopilotUsage } from '../model/Copilot_Usage';
import { GitHubApiCopilotUsage } from './GitHubApi_copilot_usage';
import { IUsageStorage } from './IUsageStorage';

import { Tenant } from '../model/Tenant';
import { dir } from 'console';
import e from 'express';

export class FileUsageStorage implements IUsageStorage {
    

    //private filePath: string = '';
    private scopeName: string = '';
    private scopeType: string = '';
    private token: string = '';
    private team?: string;
    private githubApi: GitHubApiCopilotUsage;

    private dirName: string = '../../data';

    // full path of the file named by ScopeName_metrics.json and the directory is ../data
    //private ScopeFilePath: string = ''

    // private ScopeName: string = config.scope.name;
    // private dirName: string = '../../data';
    // private ScopeFileName: string = `${config.scope.scopeType}_${config.scope.name}_metrics.json`;
    // private ScopeFilePath: string = path.join(__dirname, this.dirName, this.ScopeFileName);

    constructor(tenant: Tenant) {
        this.initializeScope(tenant);
        this.initializeFileFolder(tenant);
        this.githubApi = new GitHubApiCopilotUsage(tenant);
    }
    


    public initializeScope(tenant: Tenant) {
        // Initialize scope based on tenant information
        this.scopeName = tenant.scopeName;
        this.scopeType = tenant.scopeType;
        this.token = tenant.token;
        this.team=tenant.team;
        
    }

    private initializeFileFolder(tenant: Tenant) {

        // update the this.dirName to be the tenant's scopeType_scopeName folder. so all the files are in the same folder
        this.dirName = `../../data/${tenant.scopeType}_${tenant.scopeName}`;
        console.log('dirName now is :', this.dirName);

        // 
        /* if (tenant.team) {
            ScopeFileName = `${tenant.scopeType}_${tenant.scopeName}_team_${tenant.team}_usage.json`;
        } else {
            ScopeFileName = `${tenant.scopeType}_${tenant.scopeName}_usage.json`;
        }
        const resolvedPath = path.resolve(__dirname, this.dirName, ScopeFileName);
        this.ScopeFilePath = path.join(__dirname, this.dirName, ScopeFileName);
        if (!resolvedPath.startsWith(path.resolve(__dirname, this.dirName))) {
              throw new Error('Invalid file path');
          }
        this.ScopeFilePath = resolvedPath; */

        try{
        
             if (!fs.existsSync(path.join(__dirname, this.dirName))) {
                 fs.mkdirSync(path.join(__dirname, this.dirName));
             }
             // Create a file named by ScopeName_metrics.json within ../data folder if it does not exist
            //  if (!fs.existsSync(this.ScopeFilePath)) {
            //      fs.writeFileSync(this.ScopeFilePath, '[]');
            //  }
         }
         catch (error) {
             console.error('Error in FileUsageStorage constructor:', error);
         }
        
    }

    private getFilePath(teamSlug?: string): string {
        if (!teamSlug) {
            teamSlug = this.team;
          }
        if (teamSlug!=='') {
          return path.join(__dirname, this.dirName, `${teamSlug}_usage.json`);
        } else {
          return path.join(__dirname, this.dirName, `${this.scopeType}_${this.scopeName}_usage.json`);
        }

    }

    private getCurrentTimeFormatted(): string {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    }

    private getRandomTwoDigits(): string {
        return Math.floor(Math.random() * 90 + 10).toString(); // Random number between 10 and 99
    }

    private generateTimerFileFullName(teamSlug?: string): string {
    
        // if team is not provided, by default, will use the team information from the tenant
        if (!teamSlug) {
            teamSlug = this.team;
          }
   
        if (teamSlug && teamSlug.trim()!=='') {
            return path.join(__dirname, this.dirName, `team_${teamSlug}_${this.getCurrentTimeFormatted()}_${this.getRandomTwoDigits()}_usage.json`);
        }
        else
        {
            return path.join(__dirname, this.dirName, `${this.scopeType}_${this.scopeName}_${this.getCurrentTimeFormatted()}_${this.getRandomTwoDigits()}_usage.json`);
        }
        //return path.join(__dirname, this.dirName, `${this.scopeType}_${this.scopeName}_${this.getCurrentTimeFormatted()}_${this.getRandomTwoDigits()}_metrics.json`);
    }

    public async readUsageData( teamSlug?: string): Promise<CopilotUsage[]> {
        try {
            // if teamslug is not provided, will use the team information from the tenant
            if (!teamSlug) {
                teamSlug = this.team;
            }
            const filePath = this.getFilePath(teamSlug);
            console.log(`filePath in readUsage Data is , ${filePath}`);

            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading usage data from file:', error);
            return [];
        }
    }
/* 
    // This function is to save the fetched data to a file named by timer_filePath
    public async saveUsageData(): Promise<boolean> {
        try {
          const metrics = await getUsageApi(this.scopeType, this.scopeName, this.token);
          //console.log('Fetched metrics:', metrics);
    
          if (!Array.isArray(metrics)) {
            throw new Error('Result is not an array.');
          }
    
          const dataToWrite = JSON.stringify(metrics, null, 2);
          //console.log('Data to write:', dataToWrite);
          
            const fileFullName = this.generateTimerFileFullName();
            // write the fetch data to file named by timer_filePath, which is a new file, and it is latest data.
            fs.writeFileSync(fileFullName, dataToWrite);
            // compare and update the content of the file named by getScopeFileName,which is the ScopeUsage file
            console.log('Metrics saved successfully to file:', fileFullName);
            await this.compareAndUpdateMetrics(metrics);
            return true;
        } catch (error) {
          console.error('Error saving metrics:', error);
            return false;
        }
      } */

    // it save the fetched data to two files, one is the latest data, the other is to existing data
    // the latest data is saved to a file named by timer_filePath
    // the existing data is saved to a file named by getScopeFileName
    // both files are in the ../data/{scopeType}_{scopeName}/ folder
    // both files should consider the team information
    //if the team is not provided, by default, will use the team information from the tenant
    public async saveUsageData(metrics: CopilotUsage[], teamSlug?: string): Promise<boolean> {
        // if teamslug is provide, use it directly. if not, will use the team information from the tenant
        if (!teamSlug) {
            teamSlug = this.team;
            console.log('teamSlug is undefined, so will use the seat from the tenant, it  is :', teamSlug);
        } 
        const filePath = this.getFilePath(teamSlug);
        console.log(`filePath is , ${filePath}`);

         // Create a file named by ScopeName_metrics.json within ../data folder if it does not exist
         if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]');
        }
         
         try {
           /*  if (!metrics) {
                metrics = await getUsageApi(this.scopeType, this.scopeName, this.token,this.team);
            } */
            if (!Array.isArray(metrics)) {
                throw new Error('Result is not an array.');
            }
    
            const dataToWrite = JSON.stringify(metrics, null, 2);
            const timerfileFullName = this.generateTimerFileFullName(teamSlug);
            console.log('timerfileFullName is :', timerfileFullName);
            fs.writeFileSync(timerfileFullName, dataToWrite);

            console.log('Usage saved successfully to file:', timerfileFullName);
            await this.compareAndUpdateMetrics(metrics,undefined, teamSlug);
            return true;
        } catch (error) {
            console.error('Error saving metrics:', error);
            return false;
        }
    }
        
    private async compareAndUpdateMetrics(latestUsage?: CopilotUsage[], ScopeUsage?: CopilotUsage[], teamSlug?: string): Promise<void> {
            try {
            // if teamSlug is provided, will use it. if not, will use the team information from the tenant
            if (!teamSlug) {
                teamSlug = this.team;
            }
            else
            {
                teamSlug = teamSlug.trim();
            }
            console.log('teamSlug in compare and save methoid is :', teamSlug);
            console.log('teamSlug is :', teamSlug);
            if (!latestUsage) { 
                console.log("No latest usage data provided. Will get it from API.");
                if (teamSlug!=='')
                {
                    console.log('teamSlug is :', teamSlug);
                    latestUsage = await this.githubApi.getTeamUsageAPI(teamSlug || '');
                }
                else
                {
                    console.log('teamSlug is :', teamSlug);
                    latestUsage = await this.githubApi.getUsageApi();
                }
            }
            if (!ScopeUsage) {
            // console.log("No existing data provided. Will get it from file.");
                ScopeUsage = await this.readUsageData(teamSlug);
            }

            // Validate data
            if (!Array.isArray(latestUsage) || !Array.isArray(ScopeUsage)) {
                throw new Error("Invalid data format. Both latestUsage and ScopeUsage should be arrays.");
            }

            // Initialize lists to track days of updated and added metrics
            const updatedDays: string[] = [];
            const addedDays: string[] = [];
            // console.log('latestUsage:', latestUsage);
            //console.log('ScopeUsage:', ScopeUsage);

            if (latestUsage.length > 0) {
                latestUsage.forEach(latestMetric => {
                    const existingMetricIndex = ScopeUsage!.findIndex(orgMetric => orgMetric.day === latestMetric.day);

                    if (existingMetricIndex !== -1) {
                        // Update existing metric
                        ScopeUsage![existingMetricIndex] = latestMetric;
                        updatedDays.push(latestMetric.day);
                    } else {
                        // Add new metric
                        ScopeUsage!.push(latestMetric);
                        addedDays.push(latestMetric.day);
                    }
                });

                // Save to existing ScopeUsage file only when there are some changes
                if (updatedDays.length > 0 || addedDays.length > 0) {
                    const filePath = this.getFilePath(teamSlug);
                    fs.writeFileSync(filePath, JSON.stringify(ScopeUsage, null, 2));
                // console.log(`Days updated: ${updatedDays.join(', ')}, Days added: ${addedDays.join(', ')}`);

                    // Send notification
                    this.sendNotification(updatedDays, addedDays);
                }
            } else {
                console.log("No latest usage data provided.");
            }
        } catch (error) {
            console.error("Error in compareAndUpdateMetrics:", error);
        }
}

// Example notification method
private sendNotification(updatedDays: string[], addedDays: string[]): void {
    // Implement your notification logic here
    console.log(`Notification sent for updated days: ${updatedDays.join(', ')}, added days: ${addedDays.join(', ')}`);
}

async queryUsageData(since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<CopilotUsage[]> {
    try {
        //console.log('Querying usage data from file...， file name is ',this.ScopeFilePath);

        const filePath = this.getFilePath(this.team);
        console.log(`filePath is , ${filePath}`);

        const data = fs.readFileSync(filePath, 'utf-8');
        let metrics: CopilotUsage[] = JSON.parse(data);

        if (since) {
            metrics = metrics.filter(metric => new Date(metric.day) >= new Date(since));
        }

        if (until) {
            metrics = metrics.filter(metric => new Date(metric.day) <= new Date(until));
        }

        const start = (page - 1) * per_page;
        const end = start + per_page;
        return metrics.slice(start, end);
    } catch (error) {
        console.error('Error querying usage data from file:', error);
        return [];
    }
}

}