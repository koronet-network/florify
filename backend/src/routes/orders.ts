import { Router } from "express";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { docClient, TABLES } from "../lib/dynamo";
import { authenticateToken, requireBuyer } from "../middleware/auth";

interface IncomingOrderItem {
  productId: string;
  vendorId: string;
  vendorName: string;
  canonicalName: string;
  price: number;
  quantity: number;
}

export const ordersRouter = Router();

ordersRouter.use(authenticateToken, requireBuyer);

ordersRouter.post("/", async (req, res) => {
  try {
    const { items } = req.body as { items?: IncomingOrderItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Order items are required" });
      return;
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      canonicalName: item.canonicalName,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const invalidItem = normalizedItems.find(
      (item) =>
        !item.productId ||
        !item.vendorId ||
        !item.vendorName ||
        !item.canonicalName ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );

    if (invalidItem) {
      res.status(400).json({ error: "Invalid order items payload" });
      return;
    }

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = {
      orderId: uuid(),
      buyerId: req.user!.userId,
      buyerName: req.user!.name,
      items: normalizedItems,
      total,
      status: "placed",
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLES.ORDERS,
        Item: order,
      })
    );

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

ordersRouter.get("/", async (req, res) => {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLES.ORDERS,
        IndexName: "buyerId-index",
        KeyConditionExpression: "buyerId = :buyerId",
        ExpressionAttributeValues: {
          ":buyerId": req.user!.userId,
        },
        ScanIndexForward: false,
      })
    );

    res.json(result.Items || []);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
