// Class to standardize API responses
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode; // HTTP status code (e.g., 200, 201) representing the result of the request
        this.data = data; // Response data (could be anything: object, array, string, etc.)
        this.message = message; // Message to describe the result (defaults to "Success")
        this.success = statusCode < 400; // Determines success based on the status code (any code below 400 is considered a success)
    }
}

export { ApiResponse }; // Export the ApiResponse class for use in other parts of the application
