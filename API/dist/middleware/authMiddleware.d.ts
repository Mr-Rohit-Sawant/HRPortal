import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/jwt';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload & {
                permissions?: string[];
                businessId?: string | null;
            };
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (module: string, action: string) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireAdminOrSuperAdmin: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map