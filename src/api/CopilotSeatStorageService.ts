// src/CopilotSeatStorageService.ts
import { ISeatStorage } from './ISeatStorage';
import { Seat, TotalSeats } from '../model/Seat';
import { GitHubApiCopilotSeat } from '../api/GitHubApi_copilot_seat';
import { Tenant } from '../model/Tenant';
//import file system module, to use it to write the result to a file
const path = require('path');
const fs = require('fs');

export class CopilotSeatStorageService {
    private storage: ISeatStorage;
    private gitHubApi: GitHubApiCopilotSeat;
    private tenant: Tenant;

    constructor(storage: ISeatStorage, tenant: Tenant) {
        this.storage = storage;
        this.gitHubApi = new GitHubApiCopilotSeat(tenant);
        this.tenant = tenant;
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
            let seatData: TotalSeats;
           // let filterSeatData: TotalSeats;
            let seats: Seat[] = [];
            if (page && per_page) {
                seatData = await this.storage.getSeatData(page, per_page);
            } else {
                seatData = await this.storage.getSeatData();
                //console.log('seatData returned from storage:', seatData);
            }

            // to check whether the tenant is exist and it is not '' or null, if it is exist, filter the seats by the assigned team
            if (this.tenant.team !== '') {
                // console.log('Filtering seats by team:', this.tenant.team);
                // console.log('seatData:', seatData);
                seats = seatData.seats.filter((seat: Seat) => seat.assigning_team === this.tenant.team);
                return new TotalSeats(seats);
            }
            else {
                return seatData;
            }
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