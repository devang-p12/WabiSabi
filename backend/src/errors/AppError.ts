export class AppError extends Error {
    statusCode: number;
    code: string;

    constructor(
        statusCode: number,
        code: string,
        message: string
    ) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;

        Object.setPrototypeOf(
            this,
            AppError.prototype
        );
    }
}