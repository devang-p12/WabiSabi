import { type JwtPayload } from "jsonwebtoken";
export declare const generateAccessToken: (userId: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyAccessToken: (token: string) => string | JwtPayload;
export declare const verifyRefreshToken: (token: string) => string | JwtPayload;
//# sourceMappingURL=jwt.d.ts.map