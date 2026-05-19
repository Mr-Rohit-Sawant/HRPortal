import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { paginate, buildPaginationMeta, generateInvoiceNumber, formatCurrency } from '../utils/helpers';
import { generateInvoicePDF } from '../services/invoicePdfService';
import { sendInvoiceEmail } from '../services/emailService';
import path from 'path';
import fs from 'fs';

export const getInvoices = async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, status, clientId, startDate, endDate } = req.query;
  const take = parseInt(limit as string);
  const pg = parseInt(page as string);
  const { skip } = paginate(pg, take);

  const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
  const where: any = { ...bizFilter };
  if (status) where.status = status;
  if (clientId) where.clientId = clientId as string;
  if (startDate || endDate) {
    where.invoiceDate = {};
    if (startDate) where.invoiceDate.gte = new Date(startDate as string);
    if (endDate) where.invoiceDate.lte = new Date(endDate as string);
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { client: { companyName: { contains: search } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, companyName: true, email: true } },
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({ success: true, data: invoices, meta: buildPaginationMeta(total, pg, take) });
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, createdByUser: { select: { firstName: true, lastName: true } } },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  res.json({ success: true, data: invoice });
};

export const createInvoice = async (req: Request, res: Response) => {
  const {
    clientId, dueDate, serviceDescription, lineItems,
    cgstRate, sgstRate, igstRate, notes, gstType, businessId: bodyBusinessId,
  } = req.body;

  // Get invoice number
  const counterSetting = await prisma.appSetting.findUnique({ where: { key: 'invoice_counter' } });
  const prefixSetting = await prisma.appSetting.findUnique({ where: { key: 'invoice_prefix' } });
  const counter = parseInt(counterSetting?.value || '1');
  const prefix = prefixSetting?.value || 'INV';

  const invoiceNumber = generateInvoiceNumber(prefix, counter);

  const items: any[] = typeof lineItems === 'string' ? JSON.parse(lineItems) : lineItems;
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);

  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
  if (gstType === 'IGST') {
    igstAmount = subtotal * (parseFloat(igstRate || '18') / 100);
  } else {
    cgstAmount = subtotal * (parseFloat(cgstRate || '9') / 100);
    sgstAmount = subtotal * (parseFloat(sgstRate || '9') / 100);
  }

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const totalAmount = subtotal + totalTax;

  // Get company settings for PDF
  const [companyNameSetting, companyAddressSetting, gstinSetting, logoSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'company_name' } }),
    prisma.appSetting.findUnique({ where: { key: 'company_address' } }),
    prisma.appSetting.findUnique({ where: { key: 'gstin' } }),
    prisma.appSetting.findUnique({ where: { key: 'app_logo' } }),
  ]);

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  // Generate PDF
  const pdfPath = await generateInvoicePDF({
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
    logoPath: logoSetting?.value ? path.join(process.cwd(), logoSetting.value) : undefined,
  });

  const invoice = await prisma.invoice.create({
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
      businessId: req.user?.isSuperAdmin ? (bodyBusinessId || undefined) : (req.user?.businessId ?? undefined),
    },
    include: { client: true },
  });

  // Increment invoice counter
  await prisma.appSetting.update({
    where: { key: 'invoice_counter' },
    data: { value: String(counter + 1) },
  });

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'invoices', recordId: invoice.id },
  });

  res.status(201).json({ success: true, message: 'Invoice created', data: invoice });
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, paidAmount, paidAt, paymentMethod, paymentReference } = req.body;

  const invoice = await prisma.invoice.update({
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

export const sendInvoiceToClient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!invoice) throw new AppError('Invoice not found', 404);
  if (!invoice.pdfPath) throw new AppError('Invoice PDF not generated', 400);

  const pdfPath = path.join(process.cwd(), invoice.pdfPath);
  if (!fs.existsSync(pdfPath)) throw new AppError('Invoice PDF file missing', 400);

  await sendInvoiceEmail(
    invoice.client.email,
    invoice.client.companyName,
    invoice.invoiceNumber,
    formatCurrency(Number(invoice.totalAmount)),
    pdfPath
  );

  await prisma.invoice.update({ where: { id }, data: { status: 'SENT' } });
  res.json({ success: true, message: 'Invoice sent to client' });
};

export const downloadInvoicePDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice?.pdfPath) throw new AppError('Invoice PDF not found', 404);

  const pdfPath = path.join(process.cwd(), invoice.pdfPath);
  if (!fs.existsSync(pdfPath)) throw new AppError('PDF file not found', 404);

  res.download(pdfPath, `${invoice.invoiceNumber}.pdf`);
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } });

  if (invoice.status === 'PAID') throw new AppError('Cannot delete a paid invoice', 400);

  if (invoice.pdfPath) {
    const pdfPath = path.join(process.cwd(), invoice.pdfPath);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  }

  await prisma.invoice.delete({ where: { id } });
  res.json({ success: true, message: 'Invoice deleted' });
};
