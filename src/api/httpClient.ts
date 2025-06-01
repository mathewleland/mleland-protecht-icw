import { ConfigureRequest, ICWResponse } from './types';

const API_BASE = 'https://api.sandbox.protecht.com';

export async function configureICW(
    apiKey: string,
    payload: ConfigureRequest
): Promise<ICWResponse> {
    const response = await fetch(`${API_BASE}/api/internal/widgets/icw/configure/v4`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-protecht-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error ${response.status}: ${text}`);
    }
    const data = (await response.json()) as ICWResponse;
    console.log('data', data);
    return data;
}