export function buildSuccessResponse(data){
    return {
        success: true,
        data,
        timestamp: new Date().toISOString()
    }
}

/**
 * @param {string} error   what went wrong
 * @param {object} [options]
 * @param {boolean} [options.written]  this sentence was written for the person
 *   reading it, and holds nothing but words we chose. Every 5xx body is
 *   redacted on the way out, because a controller usually passes the driver's
 *   own text and that is a free map of the schema. A few are not like that: the
 *   AI generator's failures are sentences somebody has to act on - a key, a
 *   balance, try again - and replacing them with a reference number left the
 *   person with nothing to do and us with nothing to go on. The marker never
 *   reaches the client; it is read and removed by hideInternalErrors.
 */
export function buildErrorResponse(error, options = {}){
    return {
        success: false,
        error: error ?? "Server Error",
        ...(options.written ? { written: true } : {}),
        timestamp: new Date().toISOString()
    }
}