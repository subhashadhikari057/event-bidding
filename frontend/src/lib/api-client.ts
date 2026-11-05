const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const AUTH_UNAUTHORIZED_EVENT = "mero-event:unauthorized";

interface BackendErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  suppressUnauthorizedEvent?: boolean;
};

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (response.status === 204) return undefined;
  if (contentType?.includes("application/json")) return response.json();
  const text = await response.text();
  return text || undefined;
}

function errorFromResponse(status: number, body: unknown): ApiError {
  const errorBody = body && typeof body === "object" ? body as BackendErrorBody : undefined;
  const messages = Array.isArray(errorBody?.message)
    ? errorBody.message
    : errorBody?.message
      ? [errorBody.message]
      : [];
  const fallback: Record<number, string> = {
    400: "Please check the information you entered.",
    401: "Your session has expired. Please sign in again.",
    403: "You do not have permission to perform this action.",
    404: "The requested record could not be found.",
    409: "This action conflicts with the current record state.",
    500: "The server could not complete your request.",
  };
  return new ApiError(messages[0] ?? fallback[status] ?? "Something went wrong.", status, messages);
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { suppressUnauthorizedEvent = false, ...requestOptions } = options;
  const isFormData = requestOptions.body instanceof FormData;
  const headers = new Headers(requestOptions.headers);
  if (requestOptions.body !== undefined && !isFormData) headers.set("Content-Type", "application/json");
  const requestBody: BodyInit | undefined = requestOptions.body === undefined
    ? undefined
    : isFormData
      ? requestOptions.body as FormData
      : JSON.stringify(requestOptions.body);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers,
      credentials: "include",
      body: requestBody,
    });
  } catch {
    throw new ApiError("Unable to reach the Mero Event API. Check that the backend is running.", 0);
  }

  const body = await parseBody(response);
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login" && !suppressUnauthorizedEvent && typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    throw errorFromResponse(response.status, body);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: (path: string) => apiRequest<void>(path, { method: "DELETE" }),
};

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
