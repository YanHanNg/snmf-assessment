export interface User {
    user_id, string, 
    name: string,
    email: string, 
    reward_pts: number,
    notification: boolean
}

export interface Reminder {
    id: number,
    reminder_type_id: number,
    title: string,
    image: string,
    s3_image_key: string,
    message: string,
    reminder_date: Date,
    user_id: string,
    status: number,
    rewards_pts: number,
    created_date: Date,
    completed_date: Date,
    timelapsed?: string,
    imageData?: Blob
}

export interface ReminderCameraImage {
    reminder_id: number,
    message: string, 
    imageAsDataUrl: string,
	imageData: Blob
}

export interface Forecast {
    area: string,
    forecast: string
}

export interface WeatherForecast {
    start_date: Date,
    end_date: Date,
    forecast: Forecast[]
}
