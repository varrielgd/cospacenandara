import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const generateDraft: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllEmails: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendDirectEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInbox: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const syncInbox: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEmailsByImporter: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateLeadEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const fetchGoogleDriveFile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=email.controller.d.ts.map