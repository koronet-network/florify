import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { v4 as uuid } from "uuid";

const endpoint = process.env.DYNAMO_ENDPOINT || "http://localhost:8000";
console.log(`Connecting to DynamoDB at ${endpoint}`);

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5000,
    socketTimeout: 5000,
  }),
  maxAttempts: 3,
});
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

async function tableExists(name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch {
    return false;
  }
}

async function createTables() {
  if (!(await tableExists("Users"))) {
    await client.send(
      new CreateTableCommand({
        TableName: "Users",
        KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
        AttributeDefinitions: [
          { AttributeName: "userId", AttributeType: "S" },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log("Created Users table");
  }

  if (!(await tableExists("Products"))) {
    await client.send(
      new CreateTableCommand({
        TableName: "Products",
        KeySchema: [{ AttributeName: "productId", KeyType: "HASH" }],
        AttributeDefinitions: [
          { AttributeName: "productId", AttributeType: "S" },
          { AttributeName: "canonicalName", AttributeType: "S" },
          { AttributeName: "price", AttributeType: "N" },
          { AttributeName: "vendorId", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "canonicalName-index",
            KeySchema: [
              { AttributeName: "canonicalName", KeyType: "HASH" },
              { AttributeName: "price", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "vendorId-index",
            KeySchema: [
              { AttributeName: "vendorId", KeyType: "HASH" },
              { AttributeName: "canonicalName", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log("Created Products table");
  }

  if (!(await tableExists("Orders"))) {
    await client.send(
      new CreateTableCommand({
        TableName: "Orders",
        KeySchema: [{ AttributeName: "orderId", KeyType: "HASH" }],
        AttributeDefinitions: [
          { AttributeName: "orderId", AttributeType: "S" },
          { AttributeName: "buyerId", AttributeType: "S" },
          { AttributeName: "createdAt", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "buyerId-index",
            KeySchema: [
              { AttributeName: "buyerId", KeyType: "HASH" },
              { AttributeName: "createdAt", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log("Created Orders table");
  }

  if (!(await tableExists("NotificationReads"))) {
    await client.send(
      new CreateTableCommand({
        TableName: "NotificationReads",
        KeySchema: [
          { AttributeName: "vendorId", KeyType: "HASH" },
          { AttributeName: "canonicalName", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
          { AttributeName: "vendorId", AttributeType: "S" },
          { AttributeName: "canonicalName", AttributeType: "S" },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log("Created NotificationReads table");
  }
}

const VENDOR_1 = { userId: "vendor-1", name: "Flora Express", slug: "flora-express" };
const VENDOR_2 = { userId: "vendor-2", name: "Bloom Direct", slug: "bloom-direct" };
const VENDOR_3 = { userId: "vendor-3", name: "Petal Paradise", slug: "petal-paradise" };
const VENDOR_4 = { userId: "vendor-4", name: "Garden Grove", slug: "garden-grove" };
const VENDOR_5 = { userId: "vendor-5", name: "Rose & Stem", slug: "rose-stem" };
const VENDOR_6 = { userId: "vendor-6", name: "Wildflower Co", slug: "wildflower-co" };

const users = [
  {
    userId: VENDOR_1.userId,
    email: "flora@express.com",
    password: "password123",
    role: "vendor",
    name: VENDOR_1.name,
    slug: VENDOR_1.slug,
  },
  {
    userId: VENDOR_2.userId,
    email: "bloom@direct.com",
    password: "password123",
    role: "vendor",
    name: VENDOR_2.name,
    slug: VENDOR_2.slug,
  },
  {
    userId: VENDOR_3.userId,
    email: "petal@paradise.com",
    password: "password123",
    role: "vendor",
    name: VENDOR_3.name,
    slug: VENDOR_3.slug,
  },
  {
    userId: VENDOR_4.userId,
    email: "info@gardengrove.com",
    password: "password123",
    role: "vendor",
    name: VENDOR_4.name,
    slug: VENDOR_4.slug,
  },
  {
    userId: VENDOR_5.userId,
    email: "hello@rosestem.com",
    password: "password123",
    role: "vendor",
    name: VENDOR_5.name,
    slug: VENDOR_5.slug,
  },
  {
    userId: VENDOR_6.userId,
    email: "orders@wildflower.co",
    password: "password123",
    role: "vendor",
    name: VENDOR_6.name,
    slug: VENDOR_6.slug,
  },
  {
    userId: "buyer-1",
    email: "jane@buyer.com",
    password: "password123",
    role: "buyer",
    name: "Jane Buyer",
  },
];

interface ProductSeed {
  canonicalName: string;
  category: string;
  color: string;
  stemPerBunch: number;
  unitPerBox: number;
  boxType: string;
  vendors: { vendor: typeof VENDOR_1; price: number }[];
}

const products: ProductSeed[] = [
  {
    canonicalName: "Red Roses - 1 Dozen",
    category: "Roses",
    color: "Red",
    stemPerBunch: 12,
    unitPerBox: 4,
    boxType: "FB",
    vendors: [
      { vendor: VENDOR_1, price: 45 },
      { vendor: VENDOR_2, price: 38 },
      { vendor: VENDOR_3, price: 41 },
      { vendor: VENDOR_5, price: 39 },
    ],
  },
  {
    canonicalName: "Assorted Hydrangea",
    category: "Hydrangea",
    color: "Assorted",
    stemPerBunch: 10,
    unitPerBox: 5,
    boxType: "QB",
    vendors: [
      { vendor: VENDOR_1, price: 62 },
      { vendor: VENDOR_2, price: 70 },
      { vendor: VENDOR_3, price: 65 },
      { vendor: VENDOR_5, price: 60 },
    ],
  },
  {
    canonicalName: "Bright Yellow Sunflower",
    category: "Sunflower",
    color: "Bright Yellow",
    stemPerBunch: 5,
    unitPerBox: 8,
    boxType: "EB",
    vendors: [
      { vendor: VENDOR_1, price: 28 },
      { vendor: VENDOR_2, price: 25 },
      { vendor: VENDOR_4, price: 24 },
      { vendor: VENDOR_6, price: 26 },
    ],
  },
  {
    canonicalName: "Blue Alstroemeria",
    category: "Alstroemeria",
    color: "Blue",
    stemPerBunch: 10,
    unitPerBox: 10,
    boxType: "EB",
    vendors: [
      { vendor: VENDOR_1, price: 32 },
      { vendor: VENDOR_2, price: 35 },
      { vendor: VENDOR_3, price: 31 },
      { vendor: VENDOR_6, price: 30 },
    ],
  },
  {
    canonicalName: "Green 50cm Gerbera",
    category: "Gerbera",
    color: "Green",
    stemPerBunch: 4,
    unitPerBox: 25,
    boxType: "QB",
    vendors: [
      { vendor: VENDOR_1, price: 40 },
      { vendor: VENDOR_2, price: 42 },
      { vendor: VENDOR_4, price: 39 },
      { vendor: VENDOR_6, price: 41 },
    ],
  },
  {
    canonicalName: "20cm Agapanthus",
    category: "Agapanthus",
    color: "Purple",
    stemPerBunch: 4,
    unitPerBox: 11,
    boxType: "QB",
    vendors: [
      { vendor: VENDOR_1, price: 22 },
      { vendor: VENDOR_2, price: 18 },
      { vendor: VENDOR_4, price: 20 },
    ],
  },
  {
    canonicalName: "Burgundy Alstroemeria",
    category: "Alstroemeria",
    color: "Burgundy",
    stemPerBunch: 10,
    unitPerBox: 10,
    boxType: "F",
    vendors: [
      { vendor: VENDOR_1, price: 30 },
      { vendor: VENDOR_2, price: 33 },
      { vendor: VENDOR_4, price: 29 },
    ],
  },
  {
    canonicalName: "White Tulips - Premium",
    category: "Tulips",
    color: "White",
    stemPerBunch: 10,
    unitPerBox: 6,
    boxType: "FB",
    vendors: [
      { vendor: VENDOR_1, price: 50 },
      { vendor: VENDOR_2, price: 48 },
      { vendor: VENDOR_3, price: 49 },
      { vendor: VENDOR_5, price: 47 },
    ],
  },
  {
    canonicalName: "Pink Dahlia Rose",
    category: "Roses",
    color: "Pink",
    stemPerBunch: 10,
    unitPerBox: 5,
    boxType: "EB",
    vendors: [
      { vendor: VENDOR_1, price: 55 },
      { vendor: VENDOR_2, price: 52 },
      { vendor: VENDOR_4, price: 51 },
      { vendor: VENDOR_5, price: 53 },
    ],
  },
  {
    canonicalName: "Green Yoko Ono Pom Button",
    category: "Pom Button",
    color: "Green",
    stemPerBunch: 12,
    unitPerBox: 3,
    boxType: "FB",
    vendors: [
      { vendor: VENDOR_1, price: 36 },
      { vendor: VENDOR_2, price: 36 },
      { vendor: VENDOR_3, price: 34 },
      { vendor: VENDOR_6, price: 35 },
    ],
  },
  {
    canonicalName: "Bleach White Amaranthus",
    category: "Amaranthus",
    color: "Bleach White",
    stemPerBunch: 10,
    unitPerBox: 2,
    boxType: "QB",
    vendors: [
      { vendor: VENDOR_1, price: 44 },
      { vendor: VENDOR_5, price: 43 },
    ],
  },
  {
    canonicalName: "Lavender Orchid Spray",
    category: "Orchids",
    color: "Lavender",
    stemPerBunch: 6,
    unitPerBox: 4,
    boxType: "EB",
    vendors: [
      { vendor: VENDOR_2, price: 75 },
      { vendor: VENDOR_6, price: 72 },
    ],
  },
  {
    canonicalName: "Coral Peonies",
    category: "Peonies",
    color: "Coral",
    stemPerBunch: 10,
    unitPerBox: 6,
    boxType: "FB",
    vendors: [
      { vendor: VENDOR_3, price: 58 },
      { vendor: VENDOR_4, price: 55 },
      { vendor: VENDOR_5, price: 57 },
    ],
  },
  {
    canonicalName: "White Ranunculus",
    category: "Ranunculus",
    color: "White",
    stemPerBunch: 10,
    unitPerBox: 8,
    boxType: "EB",
    vendors: [
      { vendor: VENDOR_2, price: 46 },
      { vendor: VENDOR_5, price: 44 },
      { vendor: VENDOR_6, price: 45 },
    ],
  },
  {
    canonicalName: "Mixed Eucalyptus Bundle",
    category: "Greenery",
    color: "Green",
    stemPerBunch: 15,
    unitPerBox: 6,
    boxType: "QB",
    vendors: [
      { vendor: VENDOR_1, price: 24 },
      { vendor: VENDOR_3, price: 22 },
      { vendor: VENDOR_4, price: 23 },
      { vendor: VENDOR_6, price: 21 },
    ],
  },
  {
    canonicalName: "Orange Marigold Bunch",
    category: "Marigold",
    color: "Orange",
    stemPerBunch: 12,
    unitPerBox: 7,
    boxType: "EB",
    vendors: [
      { vendor: VENDOR_2, price: 27 },
      { vendor: VENDOR_5, price: 26 },
    ],
  },
];

async function seed() {
  for (const user of users) {
    await doc.send(new PutCommand({ TableName: "Users", Item: user }));
  }
  console.log(`Seeded ${users.length} users`);

  let count = 0;
  for (const p of products) {
    for (const v of p.vendors) {
      await doc.send(
        new PutCommand({
          TableName: "Products",
          Item: {
            productId: uuid(),
            canonicalName: p.canonicalName,
            vendorId: v.vendor.userId,
            vendorName: v.vendor.name,
            price: v.price,
            category: p.category,
            color: p.color,
            stemPerBunch: p.stemPerBunch,
            unitPerBox: p.unitPerBox,
            boxType: p.boxType,
            createdAt: new Date().toISOString(),
          },
        })
      );
      count++;
    }
  }
  console.log(`Seeded ${count} product listings`);
}

async function main() {
  console.log("Testing DynamoDB connection...");
  const tables = await client.send(new ListTablesCommand({}));
  console.log("Connected. Existing tables:", tables.TableNames);

  await createTables();

  const existing = await doc.send(
    new ScanCommand({ TableName: "Users", Limit: 1 })
  );
  if (existing.Items && existing.Items.length > 0) {
    console.log("Data already seeded, skipping.");
  } else {
    await seed();
  }

  console.log("Database initialization complete.");
}

main().catch((err) => {
  console.error("Init DB failed:", err);
  process.exit(1);
});
