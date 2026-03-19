import { jest } from '@jest/globals';

// 1. Mock  dependencies with exactly name function in code handler 
jest.unstable_mockModule('../../../src/services/taskService.js', () => ({
    taskService: { 
        createNewTask: jest.fn() 
    }
}));

jest.unstable_mockModule('../../../src/utils/response.js', () => ({
    created: jest.fn((data) => ({ statusCode: 201, body: JSON.stringify(data) })),
    clientError: jest.fn((msg) => ({ statusCode: 400, body: JSON.stringify({ message: msg }) })),
    serverError: jest.fn((err) => ({ statusCode: 500, body: JSON.stringify({ error: err.message || err }) }))
}));

jest.unstable_mockModule('../../../src/utils/validator.js', () => ({
    validator: { 
        validateCreateTask: jest.fn() 
    }
}));

const { handler } = await import('../../../src/handlers/createTask.js');
const { taskService } = await import('../../../src/services/taskService.js');
const { validator } = await import('../../../src/utils/validator.js');

describe('Handler: createTask', () => {
    const mockContext = { awsRequestId: 'req-123' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 201 when task is created successfully', async () => {
        // Khớp với logic: if (!validationResult.isValid)
        validator.validateCreateTask.mockReturnValue({ isValid: true }); 
        
        const mockNewTask = { id: '123', title: 'Test Task' };
        taskService.createNewTask.mockResolvedValue(mockNewTask);

        const event = { 
            body: JSON.stringify({ title: 'Test Task' }),
            path: '/tasks',
            httpMethod: 'POST'
        };

        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(201);
        expect(JSON.parse(result.body).id).toBe('123');
    });

    test('should return 400 when validation fails', async () => {
        // simulate validator notice error
        validator.validateCreateTask.mockReturnValue({ 
            isValid: false, 
            errors: "Title is required" 
        });

        const event = { 
            body: JSON.stringify({}), 
            path: '/tasks', 
            httpMethod: 'POST' 
        };
        
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe("Title is required");
    });

    test('should return 400 when body is invalid JSON', async () => {
        const event = { 
            body: "invalid-json", 
            path: '/tasks', 
            httpMethod: 'POST' 
        };
        
        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe("Invalid JSON format.");
    });
});
