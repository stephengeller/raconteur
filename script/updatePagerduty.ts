// Replace with your actual PagerDuty API key and schedule ID
import  {AxiosResponse} from "axios";
import * as fs from "fs";
import {config} from "dotenv";
import axios from "axios";
// import moment from "moment";
import moment from 'moment-timezone';
import csv = require('csv-parser');
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

interface Row {
    Primary: string;
    Date: string;
}


const api_key =process.env.PAGERDUTY_API_KEY;
const schedule_id =process.env.PAGERDUTY_API_KEY;
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
const [firstName, lastName] = fullName.split(' ');

// Convert the start and end times into UTC format
function convert_time_to_utc(date: string, time: number): string {
    const dateTime = moment.tz(`${date} ${time}:00`, 'YYYY-MM-DD H:mm', 'Etc/UTC');
    return dateTime.format();
}

// Map the initials to full names
const initials_to_fullname: Record<string, string> = {
    'MM': 'FirstName LastName', // Will be replaced with actual first and last names
};

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

// Function to convert AEDT time to UTC and format for PagerDuty
function convert_to_utc(date_str: string, time_str: string): string {
    const schedule_date = moment.tz(`${date_str} ${time_str}`, 'DD MMM YYYY hh:mm A', 'Australia/Sydney');
    const utc_time = schedule_date.tz('UTC');
    return utc_time.format();
}

// Function to read the CSV and create a list of overrides
async function create_overrides(file_path: string): Promise<Override[]> {
    const overrides: Override[] = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(file_path)
            .pipe(csv())
            .on('data', async (row: Row) => {
                const initials = row['Primary'];
                const full_name = initials_to_fullname[initials];
                if (!full_name) {
                    console.log(`Full name for initials '${initials}' not found. Skipping.`);
                    return;
                }
                const [first_name, last_name] = full_name.split(' ');
                const user_id = await get_user_id_by_name(first_name, last_name);
                const start_time = convert_to_utc(row['Date'], '11:00 AM');
                const end_time = convert_to_utc(row['Date'], '11:00 PM');
                overrides.push({
                    start: start_time,
                    end: end_time,
                    user: {
                        id: user_id,
                        type: 'user_reference',
                        full_name, // Add full name to the override for display
                    },
                });
            })
            .on('end', () => {
                resolve(overrides);
            })
            .on('error', (err: Error) => {
                reject(err);
            });
    });
}

// Function to send override data to PagerDuty
async function post_overrides(overrides: Override[]): Promise<void> {
    for (const override of overrides) {
        const user_id = override.user.id;
        const full_name = override.user.full_name;
        const start_time = override.start;
        const end_time = override.end;
        const start_time_pretty = moment(start_time).format('DD MMM YYYY, hh:mm A');
        const end_time_pretty = moment(end_time).format('DD MMM YYYY, hh:mm A');

        const confirm = await prompt(`About to add override for ${full_name} (ID: ${user_id}) for date ${start_time_pretty} to ${end_time_pretty}, confirm? y/n: `);
        if (confirm.toLowerCase() !== 'y') {
            console.log("Override cancelled by user.");
            continue;
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

// Create an override object
async function create_override(): Promise<Override> {
    const userId = await get_user_id_by_name(firstName, lastName);
    return {
        start: convert_time_to_utc(startDate, parseInt(startTime)),
        end: convert_time_to_utc(endDate, parseInt(endTime)),
        user: {
            id: userId,
            type: 'user_reference',
            full_name: fullName
        }
    };
}

// Main execution
(async () => {
    try {
        const override = await create_override();
        console.log(override);
        // await post_overrides([override]);
    } catch (error) {
        console.error(error);
    }
})();
