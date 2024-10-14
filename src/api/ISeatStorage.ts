// src/api/ISeatStorage.ts
import { Tenant } from '../model/Tenant';
import { TotalSeats } from './Seat';

export interface ISeatStorage {
    initializeScope(tenant: Tenant): void;
    saveSeatData(seatData: TotalSeats): Promise<boolean>;
    readSeatData(): Promise<TotalSeats>;
    querySeatData(since?: string, until?: string, page?: number, per_page?: number): Promise<TotalSeats[]>;
}