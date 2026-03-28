export const fetchWithAuth = async (url: string, options: any = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Optional: Redirect to login or refresh token
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    return response;
};

export const API_BASE_URL = "http://127.0.0.1:8000/api";
