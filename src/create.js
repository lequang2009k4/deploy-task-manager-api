import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME, sendResponse } from "./utils/ddbClient.js";

export const handler = async (event) => {
    try {
        const payload = JSON.parse(event.body || "{}");
        const newItem = {
            id: uuidv4(),
            title: payload.title || "Untitled",
            status: "pending",
            createdAt: new Date().toISOString()
        };
        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newItem }));
        return sendResponse(201, newItem);
    } catch (error) {
        return sendResponse(500, { message: "Loi tao task", error: error.message });
    }
};
