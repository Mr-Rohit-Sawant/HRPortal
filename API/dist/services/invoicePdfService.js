"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = generateInvoicePDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../utils/helpers");
async function generateInvoicePDF(invoiceData) {
    const outputDir = path_1.default.join(process.cwd(), 'uploads', 'invoices');
    if (!fs_1.default.existsSync(outputDir))
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    const filename = `${invoiceData.invoiceNumber.replace(/\//g, '-')}.pdf`;
    const outputPath = path_1.default.join(outputDir, filename);
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const stream = fs_1.default.createWriteStream(outputPath);
        doc.pipe(stream);
        const primaryColor = '#1E40AF';
        const darkColor = '#0F172A';
        const grayColor = '#64748B';
        const lightGray = '#F1F5F9';
        const borderColor = '#E2E8F0';
        // Header Background
        doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
        // Logo
        if (invoiceData.logoPath && fs_1.default.existsSync(invoiceData.logoPath)) {
            try {
                doc.image(invoiceData.logoPath, 50, 20, { height: 60 });
            }
            catch { }
        }
        // Company Name on Header
        doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
            .text(invoiceData.companyName, 200, 30, { align: 'right' });
        doc.fontSize(9).font('Helvetica')
            .text(invoiceData.companyAddress || '', 200, 55, { align: 'right', width: 300 });
        if (invoiceData.companyGstin) {
            doc.text(`GSTIN: ${invoiceData.companyGstin}`, 200, 80, { align: 'right', width: 300 });
        }
        // Invoice Title
        doc.fillColor(darkColor).fontSize(24).font('Helvetica-Bold').text('TAX INVOICE', 50, 145);
        doc.moveTo(50, 175).lineTo(545, 175).strokeColor(borderColor).stroke();
        // Invoice Details Box
        doc.rect(350, 185, 195, 80).fillColor(lightGray).fill();
        doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold')
            .text('Invoice Number:', 360, 195)
            .text('Invoice Date:', 360, 215)
            .text('Due Date:', 360, 235);
        doc.font('Helvetica').fillColor(primaryColor)
            .text(invoiceData.invoiceNumber, 460, 195)
            .fillColor(darkColor)
            .text(new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN'), 460, 215)
            .text(invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('en-IN') : 'On Receipt', 460, 235);
        // Bill To Section
        doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, 195);
        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text(invoiceData.clientName, 50, 208);
        doc.fontSize(9).font('Helvetica').fillColor(grayColor)
            .text(invoiceData.clientAddress || '', 50, 222, { width: 250 });
        if (invoiceData.clientGstin) {
            doc.text(`GSTIN: ${invoiceData.clientGstin}`, 50, 260);
        }
        // Table
        const tableTop = 290;
        const tableHeaders = ['#', 'Description', 'Qty', 'Rate', 'Amount'];
        const colWidths = [30, 230, 60, 90, 90];
        const colX = [50, 80, 310, 370, 460];
        // Table Header
        doc.rect(50, tableTop, 495, 24).fillColor(primaryColor).fill();
        tableHeaders.forEach((header, i) => {
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
                .text(header, colX[i], tableTop + 7, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
        });
        // Table Rows
        let y = tableTop + 24;
        invoiceData.lineItems.forEach((item, index) => {
            const rowColor = index % 2 === 0 ? 'white' : lightGray;
            doc.rect(50, y, 495, 22).fillColor(rowColor).fill();
            doc.rect(50, y, 495, 22).strokeColor(borderColor).stroke();
            doc.fillColor(darkColor).fontSize(9).font('Helvetica')
                .text(String(index + 1), colX[0], y + 6, { width: colWidths[0], align: 'center' })
                .text(item.description, colX[1], y + 6, { width: colWidths[1] })
                .text(String(item.quantity), colX[2], y + 6, { width: colWidths[2] })
                .text((0, helpers_1.formatCurrency)(item.rate), colX[3], y + 6, { width: colWidths[3] })
                .text((0, helpers_1.formatCurrency)(item.amount), colX[4], y + 6, { width: colWidths[4] });
            y += 22;
        });
        // Totals Section
        y += 10;
        const totalsX = 360;
        const totalsWidth = 185;
        const addTotalRow = (label, amount, bold = false, color = darkColor) => {
            doc.fillColor(grayColor).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(label, totalsX, y, { width: 100 });
            doc.fillColor(color).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text((0, helpers_1.formatCurrency)(amount), totalsX + 100, y, { width: 85, align: 'right' });
            y += 18;
        };
        doc.moveTo(350, y).lineTo(545, y).strokeColor(borderColor).stroke();
        y += 8;
        addTotalRow('Subtotal:', invoiceData.subtotal);
        if (invoiceData.cgstAmount)
            addTotalRow(`CGST (${invoiceData.cgstRate}%):`, invoiceData.cgstAmount);
        if (invoiceData.sgstAmount)
            addTotalRow(`SGST (${invoiceData.sgstRate}%):`, invoiceData.sgstAmount);
        if (invoiceData.igstAmount)
            addTotalRow(`IGST (${invoiceData.igstRate}%):`, invoiceData.igstAmount);
        doc.moveTo(350, y).lineTo(545, y).strokeColor(primaryColor).lineWidth(2).stroke();
        doc.lineWidth(1);
        y += 8;
        doc.rect(350, y, 195, 28).fillColor(primaryColor).fill();
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
            .text('TOTAL:', totalsX, y + 8, { width: 100 })
            .text((0, helpers_1.formatCurrency)(invoiceData.totalAmount), totalsX + 100, y + 8, { width: 85, align: 'right' });
        // Notes
        if (invoiceData.notes) {
            y += 50;
            doc.fillColor(grayColor).fontSize(9).font('Helvetica-Bold').text('Notes:', 50, y);
            doc.fillColor(darkColor).font('Helvetica').text(invoiceData.notes, 50, y + 14, { width: 495 });
        }
        // Footer
        const footerY = doc.page.height - 60;
        doc.rect(0, footerY, doc.page.width, 60).fillColor(lightGray).fill();
        doc.fillColor(grayColor).fontSize(8).font('Helvetica')
            .text('Thank you for your business!', 50, footerY + 15, { align: 'center', width: 495 })
            .text('This is a computer generated invoice.', 50, footerY + 30, { align: 'center', width: 495 });
        doc.end();
        stream.on('finish', () => resolve(`uploads/invoices/${filename}`));
        stream.on('error', reject);
    });
}
//# sourceMappingURL=invoicePdfService.js.map