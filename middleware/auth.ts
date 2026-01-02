import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: { userId: string; role: string };
        }
    }
}

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

const extractToken = (
    authHeader: string | string[] | undefined
): string | null => {
    if (!authHeader || Array.isArray(authHeader)) return null;

    const value = authHeader.trim();
    if (!value) return null;

    // Spec: Authorization: <JWT_TOKEN>
    // Tolerate: Authorization: Bearer <JWT_TOKEN>
    const parts = value.split(" ");
    if (parts.length === 1 && parts[0]) return parts[0];
    if (parts.length === 2 && parts[0]?.toLowerCase() === "bearer" && parts[1]) return parts[1];

    return null;
};

export const verifyUser = (
    token: string
): { userId: string; role: string } | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (typeof decoded !== "object" || !decoded) return null;

        const { userId, role } = decoded as {
            userId?: string;
            role?: string;
        };

        if (!userId || !role) return null;

        return { userId, role };
    } catch {
        return null;
    }
};

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = extractToken(req.headers.authorization);

    if (!token) {
        res.status(401).json({
            success: false,
            error: "Unauthorized: Missing or invalid Authorization header",
        });
        return;
    }

    const user = verifyUser(token);
    if (!user) {
        res.status(401).json({
            success: false,
            error: "Unauthorized: Invalid token",
        });
        return;
    }

    req.user = user;
    next();
};

export const requireRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (req.user?.role !== role) {
            res.status(403).json({
                success: false,
                error: "Forbidden: Insufficient permissions",
            });
            return;
        }
        next();
    };
};
