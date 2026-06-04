import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const startDiscovery: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDiscoveryStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRecentDiscoveries: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=discovery.controller.d.ts.map