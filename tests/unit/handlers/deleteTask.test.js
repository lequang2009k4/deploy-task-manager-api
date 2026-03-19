import { jest } from '@jest/globals';

// 1. Mock các module phụ thuộc
jest.unstable_mockModule('../../../src/services/taskService.js', () => ({
    taskService: { 
        // Khớp với logic: await taskService.removeTask(id)
        removeTask: jest.fn() 
    }
}));

jest.unstable_mockModule('../../../src/utils/response.js', () => ({
    success: jest.fn((data) => ({ statusCode: 200, body: JSON.stringify(data) })),
    notFound: jest.fn((msg) => ({ statusCode: 404, body: JSON.stringify({ message: msg }) })),
    clientError: jest.fn((msg) => ({ statusCode: 400, body: JSON.stringify({ message: msg }) })),
    serverError: jest.fn((err) => ({ statusCode: 500, body: JSON.stringify({ error: err.message || err }) }))
}));

// 2. Nạp module sau khi đã chặn (mock)
const { handler } = await import('../../../src/handlers/deleteTask.js');
const { taskService } = await import('../../../src/services/taskService.js');

describe('Handler: deleteTask', () => {
    const mockContext = { awsRequestId: 'req-del-999' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 200 when task is deleted successfully', async () => {
        // Giả lập xóa thành công (hàm removeTask thường không trả về gì hoặc trả về void)
        taskService.removeTask.mockResolvedValue(undefined);

        const event = { 
            pathParameters: { id: 'TASK-123' },
            path: '/tasks/TASK-123',
            httpMethod: 'DELETE'
        };

        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.message).toContain('successfully deleted');
    });

    test('should return 400 if ID is missing', async () => {
        const event = { pathParameters: {} }; // Không có id
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe("Task ID is required.");
    });

    test('should return 404 if task to delete does not exist', async () => {
        // Giả lập service ném lỗi "Not found"
        taskService.removeTask.mockRejectedValue(new Error('Task Not found'));

        const event = { pathParameters: { id: 'NON-EXISTENT' } };
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(404);
    });

    test('should return 500 if an unexpected error occurs', async () => {
        taskService.removeTask.mockRejectedValue(new Error('DynamoDB Connection Lost'));

        const event = { pathParameters: { id: 'TASK-123' } };
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(500);
    });
});
