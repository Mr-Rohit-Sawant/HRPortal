import { Request, Response } from 'express';
export declare const getInvoices: (req: Request, res: Response) => Promise<void>;
export declare const getInvoiceById: (req: Request, res: Response) => Promise<void>;
export declare const createInvoice: (req: Request, res: Response) => Promise<void>;
export declare const updateInvoiceStatus: (req: Request, res: Response) => Promise<void>;
export declare const sendInvoiceToClient: (req: Request, res: Response) => Promise<void>;
export declare const downloadInvoicePDF: (req: Request, res: Response) => Promise<void>;
export declare const deleteInvoice: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=invoiceController.d.ts.map