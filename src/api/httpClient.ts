import { ConfigureRequest, ICWResponse } from './types';

const API_BASE = 'https://api.sandbox.protecht.com';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Simple in-memory cache with TTL
const cache = new Map<string, { data: ICWResponse; timestamp: number }>();

// Request deduplication
const pendingRequests = new Map<string, Promise<ICWResponse>>();

function createCacheKey(apiKey: string, payload: ConfigureRequest): string {
    return `${apiKey}:${JSON.stringify(payload)}`;
}

function isValidCacheEntry(entry: { data: ICWResponse; timestamp: number }): boolean {
    return Date.now() - entry.timestamp < CACHE_TTL;
}

function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

export async function configureICW(
    apiKey: string,
    payload: ConfigureRequest
): Promise<ICWResponse> {
    const cacheKey = createCacheKey(apiKey, payload);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isValidCacheEntry(cached)) {
        return cached.data;
    }
    
    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }
    
    // Create new request
    const request = withTimeout(
        fetch(`${API_BASE}/api/internal/widgets/icw/configure/v4`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-protecht-api-key': apiKey
            },
            body: JSON.stringify(payload)
        }),
        REQUEST_TIMEOUT
    ).then(async (response) => {
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.status}: ${text}`);
        }
        
        const data = await response.json() as ICWResponse;
        
        // Cache the response
        cache.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
    }).finally(() => {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
    });
    
    // Store pending request
    pendingRequests.set(cacheKey, request);
    
    return request;
}

// Cleanup function to prevent memory leaks
export function clearCache() {
    cache.clear();
    pendingRequests.clear();
}