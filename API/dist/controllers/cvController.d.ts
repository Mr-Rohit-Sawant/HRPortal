import { Request, Response } from 'express';
export declare const getCandidates: (req: Request, res: Response) => Promise<void>;
export declare const getCandidateById: (req: Request, res: Response) => Promise<void>;
export declare const createCandidate: (req: Request, res: Response) => Promise<void>;
export declare const updateCandidate: (req: Request, res: Response) => Promise<void>;
export declare const deleteCandidate: (req: Request, res: Response) => Promise<void>;
export declare const togglePriority: (req: Request, res: Response) => Promise<void>;
export declare const bulkImportCVs: (req: Request, res: Response) => Promise<void>;
export declare const getBulkImportStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadCV: (req: Request, res: Response) => Promise<void>;
export declare const updateCustomFields: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=cvController.d.ts.map