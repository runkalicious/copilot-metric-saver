export class Seat {
    login: string;
    id: number;
    team: string;
    created_at: string;
    last_activity_at: string;
    last_activity_editor: string;

    constructor(data: any) {
        if (!data.assignee) {
            console.error("Assignee data is missing for item:", JSON.stringify(data, null, 2));
            throw new Error("Assignee data is missing");
        }
        this.login = data.assignee.login;
        this.id = data.assignee.id;
        this.team = data.assigning_team ? data.assigning_team.name : '';
        this.created_at = data.created_at;
        this.last_activity_at = data.last_activity_at;
        this.last_activity_editor = data.last_activity_editor;
    }
}

export class TotalSeats {
    total_seats: number;
    seats: Seat[];

    constructor(seats: Seat[]) {
        if (!Array.isArray(seats)) {
            throw new Error("Seats must be an array");
        }
        this.total_seats = seats.length;
        this.seats = seats;
        //console.log('TotalSeats data received:', JSON.stringify(seats, null, 2));
    }
}