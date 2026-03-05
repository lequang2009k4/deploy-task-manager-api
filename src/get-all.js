import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, sendResponse } from './utils/ddbClient.js';

export const handler = async () => {
    try {
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        return sendResponse(200, data.Items);
    } catch (error) {
        return sendResponse(500, { message: "Lỗi lấy danh sách", error: error.message });
    }
};
