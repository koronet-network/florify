import { Router } from "express";
import jwt from "jsonwebtoken";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "../lib/dynamo";

const JWT_SECRET = process.env.JWT_SECRET || "floral-marketplace-dev-secret";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    const user = result.Items?.[0];
    if (!user || user.password !== password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
        ...(user.slug ? { slug: user.slug } : {}),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/vendors", async (_req, res) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        FilterExpression: "#role = :vendorRole",
        ExpressionAttributeNames: {
          "#role": "role",
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":vendorRole": "vendor",
        },
        ProjectionExpression: "userId, #name, email, slug",
      })
    );

    const vendors = (result.Items || [])
      .map((vendor) => ({
        userId: vendor.userId,
        name: vendor.name,
        email: vendor.email,
        slug: vendor.slug,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    res.json(vendors);
  } catch (err) {
    console.error("Vendors list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/vendor-by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        FilterExpression: "#r = :role AND slug = :slug",
        ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":role": "vendor", ":slug": slug },
      })
    );

    const vendor = result.Items?.[0];
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    res.json({
      userId: vendor.userId,
      email: vendor.email,
      name: vendor.name,
      slug: vendor.slug,
    });
  } catch (err) {
    console.error("Vendor slug lookup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
