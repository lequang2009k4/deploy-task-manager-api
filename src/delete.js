import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, sendResponse } from './utils/ddbClient.js';

export const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
        return sendResponse(200, { message: `Đã xóa task ${id}` });
    } catch (error) {
        return sendResponse(500, { message: "Lỗi khi xóa", error: error.message });
    }
};
