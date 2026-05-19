import { Request, Response } from 'express';
export declare const getUserNotifications: (req: Request, res: Response) => Promise<void>;
export declare const createUserNotification: (req: Request, res: Response) => Promise<void>;
export declare const updateUserNotification: (req: Request, res: Response) => Promise<void>;
export declare const deleteUserNotification: (req: Request, res: Response) => Promise<void>;
export declare const getNotificationPermissions: (_req: Request, res: Response) => Promise<void>;
export declare const markNotificationRead: (req: Request, res: Response) => Promise<void>;
export declare const updateNotificationPermissions: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userNotificationController.d.ts.map