// Custom error class to handle API-related errors, extending the built-in Error class
class ApiError extends Error {
    constructor(
        statusCode, // HTTP status code (e.g., 404, 500) representing the type of error
        message = "Something went wrong", // Default error message
        errors = [], // Array to hold any additional error details
        stack = "" // Optional stack trace for debugging
    ) {
        super(message); // Call the parent class (Error) constructor with the error message
        this.statusCode = statusCode; // Assign the provided status code to the instance
        this.data = null; // Optional data property, can be used to return additional information
        this.message = message; // Assign the error message
        this.success = false; // Indicates the request was not successful
        this.errors = errors; // Store additional error details (if any)

        // If a custom stack trace is provided, use it; otherwise, capture the current stack trace
        if (stack) {
            this.stack = stack;
        } else {
            // Captures the stack trace for debugging, excluding the constructor itself
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }; // Export the ApiError class for use in other parts of the application
