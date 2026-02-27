import { Router } from "express";
import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "../lib/dynamo";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res) => {
  try {
    const result = await docClient.send(
      new ScanCommand({ TableName: TABLES.PRODUCTS })
    );

    const items = result.Items || [];
    const grouped = new Map<string, { lowestPrice: number; vendorCount: number; category: string; color: string; stemPerBunch: number; unitPerBox: number; boxType: string }>();

    for (const item of items) {
      const name = item.canonicalName as string;
      const existing = grouped.get(name);
      if (!existing) {
        grouped.set(name, {
          lowestPrice: item.price,
          vendorCount: 1,
          category: item.category,
          color: item.color,
          stemPerBunch: item.stemPerBunch,
          unitPerBox: item.unitPerBox,
          boxType: item.boxType,
        });
      } else {
        existing.vendorCount++;
        if (item.price < existing.lowestPrice) {
          existing.lowestPrice = item.price;
        }
      }
    }

    const products = Array.from(grouped.entries()).map(([canonicalName, data]) => ({
      canonicalName,
      ...data,
    }));

    res.json(products);
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

productsRouter.get("/trending", async (_req, res) => {
  try {
    const productsResult = await docClient.send(
      new ScanCommand({ TableName: TABLES.PRODUCTS })
    );
    const productItems = productsResult.Items || [];

    const grouped = new Map<
      string,
      {
        canonicalName: string;
        lowestPrice: number;
        vendorCount: number;
        category: string;
        color: string;
        stemPerBunch: number;
        unitPerBox: number;
        boxType: string;
      }
    >();

    for (const item of productItems) {
      const canonicalName = String(item.canonicalName);
      const existing = grouped.get(canonicalName);

      if (!existing) {
        grouped.set(canonicalName, {
          canonicalName,
          lowestPrice: Number(item.price),
          vendorCount: 1,
          category: String(item.category),
          color: String(item.color),
          stemPerBunch: Number(item.stemPerBunch),
          unitPerBox: Number(item.unitPerBox),
          boxType: String(item.boxType),
        });
      } else {
        existing.vendorCount += 1;
        existing.lowestPrice = Math.min(existing.lowestPrice, Number(item.price));
      }
    }

    const ordersResult = await docClient.send(
      new ScanCommand({ TableName: TABLES.ORDERS })
    );
    const orders = ordersResult.Items || [];
    const soldByCanonicalName = new Map<string, number>();

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const orderItem of items) {
        const canonicalName = String(orderItem.canonicalName || "");
        const quantity = Number(orderItem.quantity || 0);
        if (!canonicalName || !Number.isFinite(quantity) || quantity <= 0) continue;
        soldByCanonicalName.set(
          canonicalName,
          (soldByCanonicalName.get(canonicalName) || 0) + quantity
        );
      }
    }

    let trending: Array<{
      canonicalName: string;
      totalSold: number;
      lowestPrice: number;
      vendorCount: number;
      category: string;
      color: string;
      stemPerBunch: number;
      unitPerBox: number;
      boxType: string;
    }> = [];

    if (soldByCanonicalName.size > 0) {
      trending = Array.from(soldByCanonicalName.entries())
        .map(([canonicalName, totalSold]) => {
          const summary = grouped.get(canonicalName);
          if (!summary) return null;
          return {
            canonicalName,
            totalSold,
            lowestPrice: summary.lowestPrice,
            vendorCount: summary.vendorCount,
            category: summary.category,
            color: summary.color,
            stemPerBunch: summary.stemPerBunch,
            unitPerBox: summary.unitPerBox,
            boxType: summary.boxType,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 6);
    } else {
      trending = Array.from(grouped.values())
        .sort(
          (a, b) =>
            b.vendorCount - a.vendorCount || a.lowestPrice - b.lowestPrice
        )
        .slice(0, 6)
        .map((item) => ({
          ...item,
          totalSold: 0,
        }));
    }

    res.json(trending);
  } catch (err) {
    console.error("Get trending products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

productsRouter.get("/:canonicalName", async (req, res) => {
  try {
    const canonicalName = decodeURIComponent(req.params.canonicalName);

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLES.PRODUCTS,
        IndexName: "canonicalName-index",
        KeyConditionExpression: "canonicalName = :cn",
        ExpressionAttributeValues: { ":cn": canonicalName },
      })
    );

    const offers = (result.Items || []).map((item) => ({
      productId: item.productId,
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      price: item.price,
      stemPerBunch: item.stemPerBunch,
      unitPerBox: item.unitPerBox,
      boxType: item.boxType,
      category: item.category,
      color: item.color,
    }));

    if (offers.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      canonicalName,
      category: offers[0].category,
      color: offers[0].color,
      offers,
    });
  } catch (err) {
    console.error("Get product detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
