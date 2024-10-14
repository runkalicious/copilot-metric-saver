// src/api/GitHubApiCopilotSeat.ts
import axios from 'axios';
import { Tenant } from '../model/Tenant';
import { TotalSeats, Seat } from '../model/Seat';

export class GitHubApiCopilotSeat {
    private tenant: Tenant;

    constructor(tenant: Tenant) {
        if (!tenant.isActive) {
            throw new Error("Inactive tenant cannot be used for API operations.");
        }
        this.tenant = tenant;
    }

    private getApiUrl(): string {
        return this.tenant.scopeType === 'organization'
            ? `https://api.github.com/orgs/${this.tenant.scopeName}/copilot/billing/seats`
            : `https://api.github.com/enterprises/${this.tenant.scopeName}/copilot/billing/seats`;
    }

    public async getCopilotSeatInfo(): Promise<TotalSeats> {
        const perPage = 50;
        let page = 1;
        let seatsData: Seat[] = [];

        let response = await axios.get(this.getApiUrl(), {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${this.tenant.token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
            params: {
                per_page: perPage,
                page: page
            }
        });

        seatsData = seatsData.concat(response.data.seats.map((item: any) => new Seat(item)));

        const totalSeats = response.data.total_seats;
        const totalPages = Math.ceil(totalSeats / perPage);

        for (page = 2; page <= totalPages; page++) {
            response = await axios.get(this.getApiUrl(), {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${this.tenant.token}`,
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                params: {
                    per_page: perPage,
                    page: page
                }
            });
           // console.log('Seats data received for page', page, ':', JSON.stringify(response.data.seats, null, 2));

            seatsData = seatsData.concat(response.data.seats.map((item: any) => new Seat(item)));
            //const validSeats = response.data.seats.filter((item: any) => item.assignee);
            //seatsData = seatsData.concat(validSeats.map((item: any) => new Seat(item)));
        }

        //return new TotalSeats({ total_seats: seatsData.length, seats: seatsData });
        return new TotalSeats(seatsData);
    }
}