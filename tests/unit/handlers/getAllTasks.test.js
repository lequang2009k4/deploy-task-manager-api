import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../../../src/services/taskService.js', () => ({
    taskService: { 
        // Must match: await taskService.listAllTasks()
        listAllTasks: jest.fn() 
    }
}));

jest.unstable_mockModule('../../../src/utils/response.js', () => ({
    // Matches success(tasks, logContext) function
    success: jest.fn((data) => ({ 
        statusCode: 200, 
        body: JSON.stringify(data) 
    })),
    // Matches serverError(error, logContext) function
    serverError: jest.fn((err) => ({ 
        statusCode: 500, 
        body: JSON.stringify({ error: err.message || err }) 
    }))
}));

// 2. Import handler and mock service after modules have been mocked
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
        // Setup mock data
        const mockTasks = [
            { id: '1', title: 'Task One' },
            { id: '2', title: 'Task Two' }
        ];
        
        // Configure the mock to return the task list
        taskService.listAllTasks.mockResolvedValue(mockTasks);

        const result = await handler(mockEvent, mockContext);

        // Verify results
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(2);
        expect(body[0].title).toBe('Task One');
    });

    test('should return 500 when service fails', async () => {
        // Simulate a database error
        taskService.listAllTasks.mockRejectedValue(new Error('Database connection failed'));

        const result = await handler(mockEvent, mockContext);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).error).toBe('Database connection failed');
    });
});
