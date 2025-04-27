interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  url: string;
  options: RequestInit;
}

class RequestPool {
  private pool: Map<string, PendingRequest[]> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async fetch(url: string, options: RequestInit = {}): Promise<any> {
    const key = this.getRequestKey(url, options);

    if (this.processing.has(key)) {
      return new Promise((resolve, reject) => {
        const pendingRequests = this.pool.get(key) || [];
        pendingRequests.push({ resolve, reject, url, options });
        this.pool.set(key, pendingRequests);
      });
    }

    this.processing.add(key);
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Process any pending requests with the same key
      const pendingRequests = this.pool.get(key);
      if (pendingRequests) {
        pendingRequests.forEach(({ resolve }) => resolve(data));
        this.pool.delete(key);
      }
      
      return data;
    } catch (error) {
      const pendingRequests = this.pool.get(key);
      if (pendingRequests) {
        pendingRequests.forEach(({ reject }) => reject(error));
        this.pool.delete(key);
      }
      throw error;
    } finally {
      this.processing.delete(key);
    }
  }

  private getRequestKey(url: string, options: RequestInit): string {
    const { method = 'GET', body } = options;
    return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
  }
}

export const requestPool = new RequestPool(); 