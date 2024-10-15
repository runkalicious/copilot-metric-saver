import * as fs from 'fs';
import path from 'path';
import { ISeatStorage } from './ISeatStorage';
import { Tenant } from '../model/Tenant';
import { TotalSeats, Seat } from '../model/Seat';

export class FileSeatStorage implements ISeatStorage {
    private scopeName: string = '';
    private scopeType: string = '';
    private token: string = '';

    private dirName: string = '../../data';
    private latestFilePostfix: string = 'latest_seats.json';
    private seatFilePostfix: string = 'seats.json';
    private LatestFilePath: string = '';  //`${tenant.scopeType}_${tenant.scopeName}_latest_seats.json`;
    private SeatFilePath: string = '';    //`${tenant.scopeType}_${tenant.scopeName}_seats.json`;


    constructor(tenant: Tenant) {
        this.initializeScope(tenant);
        this.initializeFilePath(tenant);
    }

    public initializeScope(tenant: Tenant) {
        this.scopeName = tenant.scopeName;
        this.scopeType = tenant.scopeType;
        this.token = tenant.token;
    }

    private initializeFilePath(tenant: Tenant) {
        const LatestFileName = `${tenant.scopeType}_${tenant.scopeName}_${this.latestFilePostfix}`;
        const SeatFileName = `${tenant.scopeType}_${tenant.scopeName}_${this.seatFilePostfix}`;
        this.LatestFilePath = path.join(__dirname, this.dirName, LatestFileName);
        this.SeatFilePath = path.join(__dirname, this.dirName, SeatFileName);

        try {
            if (!fs.existsSync(path.join(__dirname, this.dirName))) {
                fs.mkdirSync(path.join(__dirname, this.dirName));
            }
            if (!fs.existsSync(this.LatestFilePath)) {
                // Create empty file, no content
                fs.writeFileSync(this.LatestFilePath, '[]');
                fs.writeFileSync(this.SeatFilePath, '[]');
            }
        } catch (error) {
            console.error('Error in FileSeatStorage constructor:', error);
        }
    }

    private getCurrentTimeFormatted(): string {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    }

    private getRandomTwoDigits(): string {
        return Math.floor(Math.random() * 90 + 10).toString(); // Random number between 10 and 99
    }

    private generateTimerFileFullName(): string {
        return path.join(__dirname, this.dirName, `${this.scopeType}_${this.scopeName}_${this.getCurrentTimeFormatted()}_${this.getRandomTwoDigits()}_seats.json`);
    }

    public async saveSeatData(seatData: TotalSeats): Promise<boolean> {
        try {
        

            const dataToWrite = JSON.stringify(seatData, null, 2);
            const tempFilePath = this.generateTimerFileFullName();
            await fs.promises.writeFile(tempFilePath, dataToWrite);
            console.log('Seat data saved successfully to file:', tempFilePath);
            // then save it to latest seat file. omitting the previous content
            const latestSeatPath = this.LatestFilePath;
            await fs.promises.copyFile(tempFilePath, latestSeatPath);
            //console.log('Seat data saved successfully to file:', dataToWrite);
            console.log('Seat data saved successfully to file:', latestSeatPath);

            await this.compareAndUpdateSeats(seatData);
            return true;
        } catch (error) {
            console.error('Error saving seat data:', error);
            return false;
        }
    }

    private async compareAndUpdateSeats(latestSeats: TotalSeats): Promise<void> {
        try {
            // get existing seats with history from seat file
            const data = await fs.promises.readFile(this.SeatFilePath, 'utf-8');
            const seatInfo = JSON.parse(data);
            // seatInfo is an object with seats array, there is no other data now, like seatIfo.seats, neithor seatInfo.total_seats
            const existingSeats = seatInfo ? seatInfo: [];
            const updatedSeats: Seat[] = [];
            const addedSeats: Seat[] = [];

            console.log('Existing seats:', existingSeats.length);

            latestSeats.seats.forEach(latestSeat => {
                const existingSeatIndex = existingSeats.findIndex((seat: Seat) => 
                    seat.id === latestSeat.id && seat.last_activity_at === latestSeat.last_activity_at
                );

                if (existingSeatIndex !== -1) {
                    existingSeats[existingSeatIndex] = latestSeat;
                    updatedSeats.push(latestSeat);
                } else {
                    existingSeats.push(latestSeat);
                    addedSeats.push(latestSeat);
                }
            });

            if (updatedSeats.length > 0 || addedSeats.length > 0) {
                seatInfo.seats = existingSeats;
                await fs.promises.writeFile(this.SeatFilePath, JSON.stringify(seatInfo, null, 2));
                console.log(`Seats updated: ${updatedSeats.length}, Seats added: ${addedSeats.length}`);
            }
        } catch (error) {
            console.error('Error in compareAndUpdateSeats:', error);
        }
    }

    public async getSeatData(page?: number, per_page?: number): Promise<TotalSeats> {
        try {
            const data = fs.readFileSync(this.SeatFilePath, 'utf-8');
            const seatInfo = JSON.parse(data);
            const seats = seatInfo ? seatInfo.map((seat: any) => new Seat(seat)) : [];
            return new TotalSeats(seats);
        } catch (error) {
            console.error('Error reading seat data from file:', error);
            return new TotalSeats([]);
        }
    }

    public async querySeatData(since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<TotalSeats[]> {
        try {
            const data = fs.readFileSync(this.SeatFilePath, 'utf-8');
            let seatData: any[] = JSON.parse(data) || [];

            if (since) {
                seatData = seatData.filter(seat => new Date(seat.created_at) >= new Date(since));
            }

            if (until) {
                seatData = seatData.filter(seat => new Date(seat.created_at) <= new Date(until));
            }

            const start = (page - 1) * per_page;
            const end = start + per_page;
            return [new TotalSeats(seatData.slice(start, end))];
        } catch (error) {
            console.error('Error querying seat data from file:', error);
            return [];
        }
    }
}