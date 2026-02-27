import { Router } from "express";
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { docClient, TABLES } from "../lib/dynamo";
import { authenticateToken, requireVendor } from "../middleware/auth";

export const vendorRouter = Router();

vendorRouter.use(authenticateToken, requireVendor);

interface VendorAlert {
  canonicalName: string;
  yourPrice: number;
  marketAverage: number;
  lowestMarketPrice: number;
  percentAbove: number;
  difference: number;
}

async function computeVendorAlerts(vendorId: string): Promise<VendorAlert[]> {
  const vendorProducts = await docClient.send(
    new QueryCommand({
      TableName: TABLES.PRODUCTS,
      IndexName: "vendorId-index",
      KeyConditionExpression: "vendorId = :vid",
      ExpressionAttributeValues: { ":vid": vendorId },
    })
  );

  const alerts: VendorAlert[] = [];

  for (const product of vendorProducts.Items || []) {
    const competitors = await docClient.send(
      new QueryCommand({
        TableName: TABLES.PRODUCTS,
        IndexName: "canonicalName-index",
        KeyConditionExpression: "canonicalName = :cn",
        ExpressionAttributeValues: { ":cn": product.canonicalName },
      })
    );

    const competitorPrices = (competitors.Items || [])
      .filter((item) => item.vendorId !== vendorId)
      .map((item) => Number(item.price))
      .filter((price) => Number.isFinite(price));

    if (competitorPrices.length === 0) continue;

    const yourPrice = Number(product.price);
    if (!Number.isFinite(yourPrice)) continue;

    const lowestMarketPrice = Math.min(...competitorPrices);
    if (yourPrice <= lowestMarketPrice) continue;

    const marketAverage =
      competitorPrices.reduce((sum, price) => sum + price, 0) /
      competitorPrices.length;

    const difference = yourPrice - lowestMarketPrice;
    const percentAbove =
      lowestMarketPrice > 0 ? (difference / lowestMarketPrice) * 100 : 0;

    alerts.push({
      canonicalName: String(product.canonicalName),
      yourPrice,
      marketAverage,
      lowestMarketPrice,
      percentAbove,
      difference,
    });
  }

  alerts.sort((a, b) => b.percentAbove - a.percentAbove);
  return alerts;
}

async function getReadPriceByCanonical(vendorId: string): Promise<Map<string, number>> {
  const reads = await docClient.send(
    new QueryCommand({
      TableName: TABLES.NOTIFICATION_READS,
      KeyConditionExpression: "vendorId = :vid",
      ExpressionAttributeValues: { ":vid": vendorId },
    })
  );

  const readMap = new Map<string, number>();
  for (const read of reads.Items || []) {
    const canonicalName = String(read.canonicalName || "");
    const readAtPrice = Number(read.readAtPrice);
    if (!canonicalName || !Number.isFinite(readAtPrice)) continue;
    readMap.set(canonicalName, readAtPrice);
  }

  return readMap;
}

vendorRouter.get("/products", async (req, res) => {
  try {
    const vendorId = req.user!.userId;

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLES.PRODUCTS,
        IndexName: "vendorId-index",
        KeyConditionExpression: "vendorId = :vid",
        ExpressionAttributeValues: { ":vid": vendorId },
      })
    );

    res.json(result.Items || []);
  } catch (err) {
    console.error("Get vendor products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.post("/products", async (req, res) => {
  try {
    const { canonicalName, price, category, color, stemPerBunch, unitPerBox, boxType } = req.body;

    if (!canonicalName || price == null) {
      res.status(400).json({ error: "canonicalName and price are required" });
      return;
    }

    const item = {
      productId: uuid(),
      canonicalName,
      vendorId: req.user!.userId,
      vendorName: req.user!.name,
      price: Number(price),
      category: category || "Other",
      color: color || "Assorted",
      stemPerBunch: stemPerBunch || 1,
      unitPerBox: unitPerBox || 1,
      boxType: boxType || "EB",
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TABLES.PRODUCTS, Item: item }));
    res.status(201).json(item);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await docClient.send(
      new GetCommand({ TableName: TABLES.PRODUCTS, Key: { productId: id } })
    );

    if (!existing.Item) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (existing.Item.vendorId !== req.user!.userId) {
      res.status(403).json({ error: "Not your product" });
      return;
    }

    const { price, canonicalName, category, color, stemPerBunch, unitPerBox, boxType } = req.body;

    const updates: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    const fields: Record<string, unknown> = { price, canonicalName, category, color, stemPerBunch, unitPerBox, boxType };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updates.push(`#${key} = :${key}`);
        names[`#${key}`] = key;
        values[`:${key}`] = key === "price" ? Number(val) : val;
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.PRODUCTS,
        Key: { productId: id },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );

    res.json(result.Attributes);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await docClient.send(
      new GetCommand({ TableName: TABLES.PRODUCTS, Key: { productId: id } })
    );

    if (!existing.Item) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (existing.Item.vendorId !== req.user!.userId) {
      res.status(403).json({ error: "Not your product" });
      return;
    }

    await docClient.send(
      new DeleteCommand({ TableName: TABLES.PRODUCTS, Key: { productId: id } })
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.get("/notifications/:vendorId/unread-count", async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (vendorId !== req.user!.userId) {
      res.status(403).json({ error: "Can only view your own notifications" });
      return;
    }

    const alerts = await computeVendorAlerts(vendorId);
    const readMap = await getReadPriceByCanonical(vendorId);

    const unreadCount = alerts.filter(
      (alert) => readMap.get(alert.canonicalName) !== alert.yourPrice
    ).length;

    res.json({ unreadCount });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.put("/notifications/read", async (req, res) => {
  try {
    const vendorId = req.user!.userId;
    const canonicalName = String(req.body?.canonicalName || "").trim();

    if (!canonicalName) {
      res.status(400).json({ error: "canonicalName is required" });
      return;
    }

    const vendorProductResult = await docClient.send(
      new QueryCommand({
        TableName: TABLES.PRODUCTS,
        IndexName: "vendorId-index",
        KeyConditionExpression: "vendorId = :vid AND canonicalName = :cn",
        ExpressionAttributeValues: {
          ":vid": vendorId,
          ":cn": canonicalName,
        },
      })
    );

    const ownPrices = (vendorProductResult.Items || [])
      .map((item) => Number(item.price))
      .filter((price) => Number.isFinite(price));

    if (ownPrices.length === 0) {
      res.status(404).json({ error: "Vendor product not found for canonicalName" });
      return;
    }

    const readAtPrice = Math.min(...ownPrices);

    await docClient.send(
      new PutCommand({
        TableName: TABLES.NOTIFICATION_READS,
        Item: {
          vendorId,
          canonicalName,
          readAtPrice,
          readAt: new Date().toISOString(),
        },
      })
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.put("/notifications/read-all", async (req, res) => {
  try {
    const vendorId = req.user!.userId;
    const alerts = await computeVendorAlerts(vendorId);

    if (alerts.length === 0) {
      res.json({ success: true, count: 0 });
      return;
    }

    for (const alert of alerts) {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.NOTIFICATION_READS,
          Item: {
            vendorId,
            canonicalName: alert.canonicalName,
            readAtPrice: alert.yourPrice,
            readAt: new Date().toISOString(),
          },
        })
      );
    }

    res.json({ success: true, count: alerts.length });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vendorRouter.get("/notifications/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (vendorId !== req.user!.userId) {
      res.status(403).json({ error: "Can only view your own notifications" });
      return;
    }

    const alerts = await computeVendorAlerts(vendorId);
    const readMap = await getReadPriceByCanonical(vendorId);

    res.json(
      alerts.map((alert) => ({
        ...alert,
        isRead: readMap.get(alert.canonicalName) === alert.yourPrice,
      }))
    );
  } catch (err) {
    console.error("Notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
