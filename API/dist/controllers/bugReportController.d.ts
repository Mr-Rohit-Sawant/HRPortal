import { Request, Response } from 'express';
export declare const getBugReports: (req: Request, res: Response) => Promise<void>;
export declare const getBugReportById: (req: Request, res: Response) => Promise<void>;
export declare const createBugReport: (req: Request, res: Response) => Promise<void>;
export declare const updateBugReport: (req: Request, res: Response) => Promise<void>;
export declare const deleteBugReport: (req: Request, res: Response) => Promise<void>;
export declare const getStatusLabels: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createStatusLabel: (req: Request, res: Response) => Promise<void>;
export declare const updateStatusLabel: (req: Request, res: Response) => Promise<void>;
export declare const deleteStatusLabel: (req: Request, res: Response) => Promise<void>;
export declare const getBugReportSettings: (_req: Request, res: Response) => Promise<void>;
export declare const updateBugReportSettings: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=bugReportController.d.ts.map