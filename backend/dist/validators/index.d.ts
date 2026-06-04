import { Request, Response, NextFunction } from 'express';
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const importerValidator: (((req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
export declare const quotationValidator: (((req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
export declare const authValidator: (((req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
export declare const sampleValidator: (((req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
//# sourceMappingURL=index.d.ts.map