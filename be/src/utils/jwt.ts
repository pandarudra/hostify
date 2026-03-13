import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

export interface JWTPayload {
  userId: string;
  githubId: string;
  username: string;
  twoFactorPending?: boolean;
  twoFactorPurpose?: "login";
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Generate JWT token for user
 */
export function generateToken(
  payload: JWTPayload,
  options?: { expiresIn?: string | number },
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn:
      options?.expiresIn || (JWT_EXPIRES_IN as string | number | undefined),
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Express middleware to authenticate requests
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): any {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login first.",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    if (payload.twoFactorPending) {
      return res.status(401).json({
        success: false,
        message: "Two-factor verification required.",
        twoFactorRequired: true,
      });
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Authenticate but allow 2FA-pending tokens (used only for finishing OTP flow)
 */
export function authenticateAllowTwoFactorPending(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): any {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login first.",
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
