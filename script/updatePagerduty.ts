import axios, { AxiosResponse } from "axios";
import { config } from "dotenv";
import moment from 'moment-timezone';
import * as readline from "readline";

config(); // Load .env file

interface User {
    id: string;
    type: string;
    full_name: string;
}

interface Override {
    start: string;
    end: string;
    user: User;
}

const api_key = process.env.PAGERDUTY_API_KEY;
const schedule_id = process.env.PAGERDUTY_SCHEDULE;
const pd_api_url = 'https://api.pagerduty.com';

// Headers for PagerDuty API
const headers = {
    Authorization: `Token token=${api_key}`,
    Accept: 'application/vnd.pagerduty+json;version=2',
    'Content-Type': 'application/json',
};

// Process command line arguments
const args = process.argv.slice(2);
if (args.length !== 5) {
    console.error('Usage: ts-node update-pagerduty.ts "<Full Name>" <Start Time> <End Time> "<Start Date>" "<End Date>"');
    process.exit(1);
}

const [fullName, startTime, endTime, startDate, endDate] = args;

// Function to get PagerDuty user ID by full name
async function get_user_id_by_name(firstName: string, lastName: string): Promise<string> {
    const response: AxiosResponse<{ users: { id: string }[] }> = await axios.get(
        `${pd_api_url}/users?query=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}`,
        { headers }
    );
    const users = response.data.users;
    if (users.length !== 1) {
        throw new Error(`Expected 1 user, found ${users.length} for name ${firstName} ${lastName}`);
    }
    return users[0].id;
}

// Function to convert time from Vancouver to UTC
function convert_to_utc(date: string, time: number, timeZone: string): string {
    const dateTime = moment.tz(`${date} ${time}:00`, 'YYYY-MM-DD H:mm', timeZone);
    return dateTime.utc().format();
}

// Function to create override objects for each day in the range
async function create_overrides(fullName: string, startTime: number, endTime: number, startDate: string, endDate: string): Promise<Override[]> {
    const [firstName, lastName] = fullName.split(' ');
    const userId = await get_user_id_by_name(firstName, lastName);
    const timeZone = 'America/Vancouver';

    const currentDay = moment.tz(startDate, 'YYYY-MM-DD', timeZone);
    const endDay = moment.tz(endDate, 'YYYY-MM-DD', timeZone);
    const overrides: Override[] = [];

    while (currentDay.isSameOrBefore(endDay)) {
        const startDateTime = currentDay.clone().hours(startTime);
        const endDateTime = currentDay.clone().hours(endTime);

        // If the end time is earlier than the start time, roll over to the next date
        if (endTime < startTime) {
            endDateTime.add(1, 'day');
        }

        // Convert times to UTC
        const start = startDateTime.utc().format();
        const end = endDateTime.utc().format();

        overrides.push({
            start,
            end,
            user: {
                id: userId,
                type: 'user_reference',
                full_name: fullName,
            },
        });

        // Move to the next day
        currentDay.add(1, 'days');
    }

    return overrides;
}


// Function to prompt user input in the console
function prompt(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise<string>(resolve => rl.question(query, (ans: string) => {
        rl.close();
        resolve(ans);
    }));
}

// Function to send override data to PagerDuty
async function post_overrides(overrides: Override[]): Promise<void> {
    let confirmAll = false
    for (const override of overrides) {
        const user_id = override.user.id;
        const full_name = override.user.full_name;
        const start_time_pretty = moment(override.start).tz('America/Vancouver').format('DD MMM YYYY, hh:mm A');
        const end_time_pretty = moment(override.end).tz('America/Vancouver').format('DD MMM YYYY, hh:mm A');
        
        if (!confirmAll) {
            const confirm = await prompt(`About to add override for ${full_name} (ID: ${user_id}) for date ${start_time_pretty} to ${end_time_pretty}, confirm? y/n: `);
            if (confirm.toLowerCase() == 'yy') {
                confirmAll = true;
            } else if (confirm.toLowerCase() !== 'y') {
                console.log("Override cancelled by user.");
                continue;
            }
        }

        

        try {
            const response = await axios.post(
                `${pd_api_url}/schedules/${schedule_id}/overrides`,
                { override },
                { headers }
            );
            console.log("Override added successfully.", response.data);
        } catch (error) {
            console.error("There was an error creating the override:", error);
        }
    }
}

// Main execution
(async () => {
    try {
        // Parse start and end time as numbers
        const startTimeNumber = parseInt(startTime);
        const endTimeNumber = parseInt(endTime);

        // Validate start and end times
        if (isNaN(startTimeNumber) || isNaN(endTimeNumber)) {
            throw new Error('Start Time and End Time must be numbers.');
        }

        // Create overrides for each day
        const overrides = await create_overrides(fullName, startTimeNumber, endTimeNumber, startDate, endDate);

        // Prompt user for confirmation and post overrides to PagerDuty
        await post_overrides(overrides);
    } catch (error) {
        console.error(error);
    }
})();
