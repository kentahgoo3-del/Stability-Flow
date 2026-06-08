import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL: first element is the path, rest are query params
    const [path, ...params] = queryKey as string[];
    let url = path;
    
    // Filter out undefined/null params and build query string
    const validParams = params.filter(p => p !== undefined && p !== null && p !== "");
    if (validParams.length > 0) {
      // Check if first element starts with / and subsequent are values
      // Use them as query params based on the URL pattern
      if (path === "/api/results" && validParams.length >= 1) {
        const searchParams = new URLSearchParams();
        if (validParams[0]) searchParams.set("studyId", validParams[0]);
        if (validParams[1]) searchParams.set("timePointId", validParams[1]);
        url = `${path}?${searchParams.toString()}`;
      } else if (path === "/api/time-points" && validParams.length >= 1) {
        url = `${path}?studyId=${validParams[0]}`;
      } else if (path === "/api/test-specifications" && validParams.length >= 1) {
        url = `${path}?productId=${validParams[0]}`;
      } else {
        // Default: just use the first element as the path segment
        url = `${path}/${validParams[0]}`;
      }
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
