export function buildSuccessResponse(data){
    return {
        success: true,
        data,
        timestamp: new Date().toISOString()
    }
}

export function buildErrorResponse(error){
    return {
        success: false,
        error: error ?? "Server Error",
        timestamp: new Date().toISOString()
    }
}