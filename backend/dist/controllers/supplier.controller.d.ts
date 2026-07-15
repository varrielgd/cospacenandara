import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getAllSuppliers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSupplierById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const importSuppliers: (req: AuthRequest & {
    file?: Express.Multer.File;
}, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=supplier.controller.d.ts.map