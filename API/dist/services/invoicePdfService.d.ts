interface LineItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}
interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date;
    companyName: string;
    companyAddress: string;
    companyGstin: string;
    clientName: string;
    clientAddress: string;
    clientGstin?: string;
    lineItems: LineItem[];
    subtotal: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    totalTax?: number;
    totalAmount: number;
    notes?: string;
    logoPath?: string;
}
export declare function generateInvoicePDF(invoiceData: InvoiceData): Promise<string>;
export {};
//# sourceMappingURL=invoicePdfService.d.ts.map