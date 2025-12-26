import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import sectionsRoutes from './routes/sections';
import salesGroupsRoutes from './routes/sales-groups';
import salesSubGroupsRoutes from './routes/sales-sub-groups';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    message: null
  });
});

// API v1 routes
const API_PREFIX = '/api/v1';

app.get(API_PREFIX, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      message: 'Lottery API v1'
    },
    message: null
  });
});

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/sections`, sectionsRoutes);
app.use(`${API_PREFIX}/sales-groups`, salesGroupsRoutes);
app.use(`${API_PREFIX}/sales-sub-groups`, salesSubGroupsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API v1: http://localhost:${PORT}${API_PREFIX}`);
});

export default app;
