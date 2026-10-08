export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
//# sourceMappingURL=AppError.js.map