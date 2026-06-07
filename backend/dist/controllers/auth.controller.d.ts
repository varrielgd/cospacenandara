import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verify2FA: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const me: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const debugAuth: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllUsers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map