import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "floral-marketplace-dev-secret";

export interface AuthPayload {
  userId: string;
  email: string;
  role: "buyer" | "vendor";
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Token required" });
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

export function requireVendor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "vendor") {
    res.status(403).json({ error: "Vendor access required" });
    return;
  }
  next();
}

export function requireBuyer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "buyer") {
    res.status(403).json({ error: "Buyer access required" });
    return;
  }
  next();
}
