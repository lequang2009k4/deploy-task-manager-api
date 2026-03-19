import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../../../src/services/taskService.js', () => ({
    taskService: { 
        // Phải khớp với: await taskService.getTaskDetails(id)
        getTaskDetails: jest.fn() 
    }
}));

jest.unstable_mockModule('../../../src/utils/response.js', () => ({
    success: jest.fn((data) => ({ statusCode: 200, body: JSON.stringify(data) })),
    notFound: jest.fn((msg) => ({ statusCode: 404, body: JSON.stringify({ message: msg }) })),
    clientError: jest.fn((msg) => ({ statusCode: 400, body: JSON.stringify({ message: msg }) })),
    serverError: jest.fn((err) => ({ statusCode: 500, body: JSON.stringify({ error: err.message || err }) }))
}));

// 2. Import sau khi đã mock module
const { handler } = await import('../../../src/handlers/getTaskById.js');
const { taskService } = await import('../../../src/services/taskService.js');

describe('Handler: getTaskById', () => {
    const mockContext = { awsRequestId: 'req-get-123' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 200 if task is found', async () => {
        const mockTask = { id: '123', title: 'Deep Dive Task' };
        taskService.getTaskDetails.mockResolvedValue(mockTask);

        const event = { 
            pathParameters: { id: '123' },
            path: '/tasks/123',
            httpMethod: 'GET'
        };

        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).id).toBe('123');
    });

    test('should return 400 if ID is missing in path parameters', async () => {
        const event = { pathParameters: null }; // Hoặc không có id
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe("Task ID is required.");
    });

    test('should return 404 if service throws "Not found" error', async () => {
        // Giả lập lỗi ném ra từ Service layer theo đúng format code bạn check
        taskService.getTaskDetails.mockRejectedValue(new Error('Task Not found'));

        const event = { pathParameters: { id: '999' } };
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(404);
    });

    test('should return 500 for other service errors', async () => {
        taskService.getTaskDetails.mockRejectedValue(new Error('Database Timeout'));

        const event = { pathParameters: { id: '123' } };
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(500);
    });
});
