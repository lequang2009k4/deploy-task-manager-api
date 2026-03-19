import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../../../src/services/taskService.js', () => ({
    taskService: { 
        // Phải khớp với: await taskService.listAllTasks()
        listAllTasks: jest.fn() 
    }
}));

jest.unstable_mockModule('../../../src/utils/response.js', () => ({
    // Khớp với hàm success(tasks, logContext)
    success: jest.fn((data) => ({ 
        statusCode: 200, 
        body: JSON.stringify(data) 
    })),
    // Khớp với hàm serverError(error, logContext)
    serverError: jest.fn((err) => ({ 
        statusCode: 500, 
        body: JSON.stringify({ error: err.message || err }) 
    }))
}));

// 2. Import handler và mock service sau khi đã mock module
const { handler } = await import('../../../src/handlers/getAllTasks.js');
const { taskService } = await import('../../../src/services/taskService.js');

describe('Handler: getAllTasks', () => {
    const mockContext = { awsRequestId: 'req-getAll-123' };
    const mockEvent = {
        path: '/tasks',
        httpMethod: 'GET'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 200 with all tasks', async () => {
        // Setup dữ liệu giả định
        const mockTasks = [
            { id: '1', title: 'Task One' },
            { id: '2', title: 'Task Two' }
        ];
        
        // Cấu hình bản mock trả về danh sách task
        taskService.listAllTasks.mockResolvedValue(mockTasks);

        const result = await handler(mockEvent, mockContext);

        // Kiểm tra kết quả
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(2);
        expect(body[0].title).toBe('Task One');
    });

    test('should return 500 when service fails', async () => {
        // Giả lập lỗi database
        taskService.listAllTasks.mockRejectedValue(new Error('Database connection failed'));

        const result = await handler(mockEvent, mockContext);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).error).toBe('Database connection failed');
    });
});
