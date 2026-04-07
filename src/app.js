import express from 'express';
// Import patho of handler
import { handler as createHandler } from './handlers/createTask.js';
import { handler as getAllHandler } from './handlers/getAllTasks.js';
import { handler as getByIdHandler } from './handlers/getTaskById.js';
import { handler as deleteHandler } from './handlers/deleteTask.js';

const app = express();
app.use(express.json());

// Adapter formndler  Express Req -> Lambda Event
const lambdaWrapper = (handler) => async (req, res) => {
    const event = {
        body: req.body ? JSON.stringify(req.body) : null,
        pathParameters: req.params,
        path: req.path,
        httpMethod: req.method
    };
    const context = { awsRequestId: `ec2-${Date.now()}` };

    try {
        const result = await handler(event, context);
        res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

app.post('/tasks', lambdaWrapper(createHandler));
app.get('/tasks', lambdaWrapper(getAllHandler));
app.get('/tasks/:id', lambdaWrapper(getByIdHandler));
app.delete('/tasks/:id', lambdaWrapper(deleteHandler));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
