import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllSamples: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSample: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSample: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSample: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=sample.controller.d.ts.map