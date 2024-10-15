// src/CopilotSeatStorageService.ts
import { ISeatStorage } from './ISeatStorage';
import { TotalSeats } from '../model/Seat';
import { GitHubApiCopilotSeat } from '../api/GitHubApi_copilot_seat';
import { Tenant } from '../model/Tenant';
//import file system module, to use it to write the result to a file
const path = require('path');
const fs = require('fs');

export class CopilotSeatStorageService {
    private storage: ISeatStorage;
    private gitHubApi: GitHubApiCopilotSeat;

    constructor(storage: ISeatStorage, tenant: Tenant) {
        this.storage = storage;
        this.gitHubApi = new GitHubApiCopilotSeat(tenant);
    }

    public async saveSeatData(): Promise<boolean> {
        try {
            const seatData = await this.gitHubApi.getCopilotSeatInfo();
            // for debug. Save the result to a file named seatData + now() + .json, so the file name will be unique
            // const fileName = 'seatData' + new Date().toISOString() + '.json';
            // const filePath = path.join(__dirname, 'data', fileName); // Save to a 'data' directory in the same directory as this script
            // fs.writeFileSync(filePath, JSON.stringify(seatData));
            return await this.storage.saveSeatData(seatData);
        } catch (error) {
            console.error('Error saving seat data:', error);
            return false;
        }
    }

    public async getSeatData(page?: number, per_page?: number): Promise<TotalSeats> {
        try {
            if (page && per_page) {
                return await this.storage.getSeatData(page, per_page);
            }
            else
            return await this.storage.getSeatData();
        } catch (error) {
            console.error('Error reading seat data:', error);
            return new TotalSeats([]); 
        }
    }

    public async querySeatData(since?: string, until?: string, page?: number, per_page?: number): Promise<TotalSeats[]> {
        try {
            return await this.storage.querySeatData(since, until, page, per_page);
        } catch (error) {
            console.error('Error querying seat data:', error);
            return [];
        }
    }
}