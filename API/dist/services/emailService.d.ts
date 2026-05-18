export declare function sendWelcomeEmail(email: string, name: string, password: string, loginUrl: string): Promise<void>;
export declare function sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<void>;
export declare function sendInvoiceEmail(email: string, clientName: string, invoiceNumber: string, amount: string, pdfPath: string): Promise<void>;
export declare function verifyEmailConfig(): Promise<boolean>;
//# sourceMappingURL=emailService.d.ts.map