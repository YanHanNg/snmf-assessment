export interface User {
    user_id, string, 
    name: string,
    email: string, 
    reward_pts: number,
    notification: boolean
}

export interface Reminder {
    id: number,
    reminder_type: number,
    title: string,
    image: string,
    message: string,
    reminder_date: Date,
    status: number,
    created_date: Date,
    timelapsed?: string,
}