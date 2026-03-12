// appwrite client setup
import { Client, Account, Functions, Teams } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const functions = new Functions(client);

// calls an appwrite function synchronously
export async function callFunction(functionId, data = {}) {
    const execution = await functions.createExecution(
        functionId,
        JSON.stringify(data),
        false
    );

    if (execution.status === 'completed') {
        if (execution.responseBody) {
            return JSON.parse(execution.responseBody);
        }
        return { ok: true };
    }

    if (execution.status === 'failed') {
        // try to parse the error from stderr if available
        let errMsg = 'Function execution failed';
        if (execution.responseBody && execution.responseBody.includes('message')) {
            try {
                errMsg = JSON.parse(execution.responseBody).message || errMsg;
            } catch { }
        }
        throw new Error(errMsg);
    }

    throw new Error(`Unexpected execution status: ${execution.status}`);
}

const teams = new Teams(client);

export { client, account, teams };
