import { Client, Account, Functions, Teams } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const hasAppwriteConfig =
    typeof endpoint === 'string' && endpoint.length > 0 &&
    typeof projectId === 'string' && projectId.length > 0;

let client = null;
let account;
let functions;
let teams;

if (hasAppwriteConfig) {
    client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId);
    account = new Account(client);
    functions = new Functions(client);
    teams = new Teams(client);
} else {
    const rejecter = (name) => Promise.reject(new Error(`Appwrite configuration is missing (${name})`));
    account = {
        get: () => rejecter('account.get'),
        createSession: () => rejecter('account.createSession'),
        deleteSession: () => Promise.resolve(),
        createOAuth2Token: () => Promise.resolve(),
    };
    functions = {
        createExecution: () => rejecter('functions.createExecution'),
    };
    teams = {
        list: () => Promise.resolve({ total: 0, teams: [] }),
    };
    console.warn('Appwrite configuration is missing. Backend integrations are disabled until the env is configured.');
}

export async function callFunction(functionId, data = {}) {
    if (!functions || typeof functions.createExecution !== 'function') {
        return { ok: false, message: 'Appwrite configuration is missing' };
    }

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
        let errMsg = 'Function execution failed';
        if (execution.responseBody && execution.responseBody.includes('message')) {
            try {
                errMsg = JSON.parse(execution.responseBody).message || errMsg;
            } catch {
            }
        }
        throw new Error(errMsg);
    }

    throw new Error(`Unexpected execution status: ${execution.status}`);
}

export { client, account, teams };
