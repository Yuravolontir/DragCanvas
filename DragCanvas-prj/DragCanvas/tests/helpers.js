/**
 * Minimal stand-ins for Express req/res.
 *
 * The middlewares under test only ever read a few fields and answer through
 * res.status().json(), so a real server (and a real database behind it) would
 * add setup without adding coverage.
 */

/** A res that records what the middleware answered instead of sending it. */
export function makeRes() {
    const res = {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
    return res;
}

/** A next() that remembers whether it was called - "was the request let through". */
export function makeNext() {
    const next = () => { next.called = true; };
    next.called = false;
    return next;
}

export function makeReq({ user, params = {}, headers = {} } = {}) {
    return { user, params, headers };
}
