const API_URL = import.meta.env.VITE_API_URL;

async function apiRequest(endpoint, method, data) {
    try {
        const options = {
            method: method,
            headers: {}
        };

        if (data) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }

        const response = await fetch(API_URL + endpoint, options);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong.');
        }

        return result;

    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }cd
}

export default apiRequest;