import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, sendResponse } from './utils/ddbClient.js';

export const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        const data = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));

        if (!data.Item) return sendResponse(404, { message: "Không tìm thấy Task" });
        return sendResponse(200, data.Item);
    } catch (error) {
        return sendResponse(500, { message: "Lỗi hệ thống", error: error.message });
    }
};
