export function notFoundHandler(request, response) {
    return response.status(404).json({
        error: `Route not found: ${request.method} ${request.originalUrl}`,
    });
}
