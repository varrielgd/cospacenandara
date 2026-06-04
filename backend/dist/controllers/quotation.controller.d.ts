import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllQuotations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=quotation.controller.d.ts.map