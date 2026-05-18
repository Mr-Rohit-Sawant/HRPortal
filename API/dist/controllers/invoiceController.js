"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.downloadInvoicePDF = exports.sendInvoiceToClient = exports.updateInvoiceStatus = exports.createInvoice = exports.getInvoiceById = exports.getInvoices = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const invoicePdfService_1 = require("../services/invoicePdfService");
const emailService_1 = require("../services/emailService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getInvoices = async (req, res) => {
    const { page = '1', limit = '10', search, status, clientId, startDate, endDate } = req.query;
    const take = parseInt(limit);
    const pg = parseInt(page);
    const { skip } = (0, helpers_1.paginate)(pg, take);
    const where = {};
    if (status)
        where.status = status;
    if (clientId)
        where.clientId = clientId;
    if (startDate || endDate) {
        where.invoiceDate = {};
        if (startDate)
            where.invoiceDate.gte = new Date(startDate);
        if (endDate)
            where.invoiceDate.lte = new Date(endDate);
    }
    if (search) {
        where.OR = [
            { invoiceNumber: { contains: search } },
            { client: { companyName: { contains: search } } },
        ];
    }
    const [invoices, total] = await Promise.all([
        app_1.prisma.invoice.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: { client: { select: { id: true, companyName: true, email: true } } },
        }),
        app_1.prisma.invoice.count({ where }),
    ]);
    res.json({ success: true, data: invoices, meta: (0, helpers_1.buildPaginationMeta)(total, pg, take) });
};
exports.getInvoices = getInvoices;
const getInvoiceById = async (req, res) => {
    const { id } = req.params;
    const invoice = await app_1.prisma.invoice.findUnique({
        where: { id },
        include: { client: true, createdByUser: { select: { firstName: true, lastName: true } } },
    });
    if (!invoice)
        throw new errorMiddleware_1.AppError('Invoice not found', 404);
    res.json({ success: true, data: invoice });
};
exports.getInvoiceById = getInvoiceById;
const createInvoice = async (req, res) => {
    const { clientId, dueDate, serviceDescription, lineItems, cgstRate, sgstRate, igstRate, notes, gstType, } = req.body;
    // Get invoice number
    const counterSetting = await app_1.prisma.appSetting.findUnique({ where: { key: 'invoice_counter' } });
    const prefixSetting = await app_1.prisma.appSetting.findUnique({ where: { key: 'invoice_prefix' } });
    const counter = parseInt(counterSetting?.value || '1');
    const prefix = prefixSetting?.value || 'INV';
    const invoiceNumber = (0, helpers_1.generateInvoiceNumber)(prefix, counter);
    const items = typeof lineItems === 'string' ? JSON.parse(lineItems) : lineItems;
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (gstType === 'IGST') {
        igstAmount = subtotal * (parseFloat(igstRate || '18') / 100);
    }
    else {
        cgstAmount = subtotal * (parseFloat(cgstRate || '9') / 100);
        sgstAmount = subtotal * (parseFloat(sgstRate || '9') / 100);
    }
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = subtotal + totalTax;
    // Get company settings for PDF
    const [companyNameSetting, companyAddressSetting, gstinSetting, logoSetting] = await Promise.all([
        app_1.prisma.appSetting.findUnique({ where: { key: 'company_name' } }),
        app_1.prisma.appSetting.findUnique({ where: { key: 'company_address' } }),
        app_1.prisma.appSetting.findUnique({ where: { key: 'gstin' } }),
        app_1.prisma.appSetting.findUnique({ where: { key: 'app_logo' } }),
    ]);
    const client = await app_1.prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    // Generate PDF
    const pdfPath = await (0, invoicePdfService_1.generateInvoicePDF)({
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        companyName: companyNameSetting?.value || 'HR Recruitment System',
        companyAddress: companyAddressSetting?.value || '',
        companyGstin: gstinSetting?.value || '',
        clientName: client.companyName,
        clientAddress: `${client.address || ''} ${client.city || ''} ${client.state || ''}`.trim(),
        clientGstin: client.gstNumber ?? undefined,
        lineItems: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
        })),
        subtotal,
        cgstRate: gstType === 'CGST_SGST' ? parseFloat(cgstRate || '9') : undefined,
        sgstRate: gstType === 'CGST_SGST' ? parseFloat(sgstRate || '9') : undefined,
        igstRate: gstType === 'IGST' ? parseFloat(igstRate || '18') : undefined,
        cgstAmount: gstType === 'CGST_SGST' ? (cgstAmount || undefined) : undefined,
        sgstAmount: gstType === 'CGST_SGST' ? (sgstAmount || undefined) : undefined,
        igstAmount: gstType === 'IGST' ? (igstAmount || undefined) : undefined,
        totalTax,
        totalAmount,
        notes,
        logoPath: logoSetting?.value ? path_1.default.join(process.cwd(), logoSetting.value) : undefined,
    });
    const invoice = await app_1.prisma.invoice.create({
        data: {
            invoiceNumber,
            clientId,
            dueDate: dueDate ? new Date(dueDate) : null,
            serviceDescription,
            lineItems: items,
            subtotal,
            gstType,
            cgstRate: cgstRate ? parseFloat(cgstRate) : null,
            sgstRate: sgstRate ? parseFloat(sgstRate) : null,
            igstRate: igstRate ? parseFloat(igstRate) : null,
            cgstAmount: cgstAmount || null,
            sgstAmount: sgstAmount || null,
            igstAmount: igstAmount || null,
            totalTax,
            totalAmount,
            notes,
            pdfPath,
            status: 'DRAFT',
            createdBy: req.user?.userId,
        },
        include: { client: true },
    });
    // Increment invoice counter
    await app_1.prisma.appSetting.update({
        where: { key: 'invoice_counter' },
        data: { value: String(counter + 1) },
    });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'invoices', recordId: invoice.id },
    });
    res.status(201).json({ success: true, message: 'Invoice created', data: invoice });
};
exports.createInvoice = createInvoice;
const updateInvoiceStatus = async (req, res) => {
    const { id } = req.params;
    const { status, paidAmount, paidAt, paymentMethod, paymentReference } = req.body;
    const invoice = await app_1.prisma.invoice.update({
        where: { id },
        data: {
            status,
            paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
            paidAt: paidAt ? new Date(paidAt) : undefined,
            paymentMethod,
            paymentReference,
        },
    });
    res.json({ success: true, data: invoice });
};
exports.updateInvoiceStatus = updateInvoiceStatus;
const sendInvoiceToClient = async (req, res) => {
    const { id } = req.params;
    const invoice = await app_1.prisma.invoice.findUnique({
        where: { id },
        include: { client: true },
    });
    if (!invoice)
        throw new errorMiddleware_1.AppError('Invoice not found', 404);
    if (!invoice.pdfPath)
        throw new errorMiddleware_1.AppError('Invoice PDF not generated', 400);
    const pdfPath = path_1.default.join(process.cwd(), invoice.pdfPath);
    if (!fs_1.default.existsSync(pdfPath))
        throw new errorMiddleware_1.AppError('Invoice PDF file missing', 400);
    await (0, emailService_1.sendInvoiceEmail)(invoice.client.email, invoice.client.companyName, invoice.invoiceNumber, (0, helpers_1.formatCurrency)(Number(invoice.totalAmount)), pdfPath);
    await app_1.prisma.invoice.update({ where: { id }, data: { status: 'SENT' } });
    res.json({ success: true, message: 'Invoice sent to client' });
};
exports.sendInvoiceToClient = sendInvoiceToClient;
const downloadInvoicePDF = async (req, res) => {
    const { id } = req.params;
    const invoice = await app_1.prisma.invoice.findUnique({ where: { id } });
    if (!invoice?.pdfPath)
        throw new errorMiddleware_1.AppError('Invoice PDF not found', 404);
    const pdfPath = path_1.default.join(process.cwd(), invoice.pdfPath);
    if (!fs_1.default.existsSync(pdfPath))
        throw new errorMiddleware_1.AppError('PDF file not found', 404);
    res.download(pdfPath, `${invoice.invoiceNumber}.pdf`);
};
exports.downloadInvoicePDF = downloadInvoicePDF;
const deleteInvoice = async (req, res) => {
    const { id } = req.params;
    const invoice = await app_1.prisma.invoice.findUniqueOrThrow({ where: { id } });
    if (invoice.status === 'PAID')
        throw new errorMiddleware_1.AppError('Cannot delete a paid invoice', 400);
    if (invoice.pdfPath) {
        const pdfPath = path_1.default.join(process.cwd(), invoice.pdfPath);
        if (fs_1.default.existsSync(pdfPath))
            fs_1.default.unlinkSync(pdfPath);
    }
    await app_1.prisma.invoice.delete({ where: { id } });
    res.json({ success: true, message: 'Invoice deleted' });
};
exports.deleteInvoice = deleteInvoice;
//# sourceMappingURL=invoiceController.js.map