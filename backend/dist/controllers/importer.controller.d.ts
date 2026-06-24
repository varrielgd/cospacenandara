import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllImporters: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getImporterById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createImporter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateImporter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteImporter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkCreateImporters: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const syncToSheets: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const importImportersFromExcel: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=importer.controller.d.ts.map