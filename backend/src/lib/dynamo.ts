import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const endpoint = process.env.DYNAMO_ENDPOINT || "http://localhost:8000";

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

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  USERS: "Users",
  PRODUCTS: "Products",
  ORDERS: "Orders",
  NOTIFICATION_READS: "NotificationReads",
} as const;
