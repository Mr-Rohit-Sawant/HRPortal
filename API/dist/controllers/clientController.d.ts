import { Request, Response } from 'express';
export declare const getClients: (req: Request, res: Response) => Promise<void>;
export declare const getClientById: (req: Request, res: Response) => Promise<void>;
export declare const createClient: (req: Request, res: Response) => Promise<void>;
export declare const updateClient: (req: Request, res: Response) => Promise<void>;
export declare const toggleClientStatus: (req: Request, res: Response) => Promise<void>;
export declare const deleteClient: (req: Request, res: Response) => Promise<void>;
export declare const updateCustomFields: (req: Request, res: Response) => Promise<void>;
export declare const getClientDropdown: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=clientController.d.ts.map