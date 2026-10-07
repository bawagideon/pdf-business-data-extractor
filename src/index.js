// PDF Business Data Extractor Engine
class PdfBusinessDataExtractor {
  constructor() {}

  extractInvoiceText(rawText) {
    // 1. Invoice Number
    const invMatch = rawText.match(/(?:Invoice|INV|Bill)[\s#:]*([A-Z0-9-]+)/i);
    const invoiceNumber = invMatch ? invMatch[1] : 'INV-UNKNOWN';

    // 2. Vendor Name
    const vendorMatch = rawText.match(/Vendor:\s*([^\n]+)/i) || rawText.match(/From:\s*([^\n]+)/i);
    const vendor = vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor';

    // 3. Due Date
    const dueMatch = rawText.match(/(?:Due Date|Due):\s*([\d\/-]+)/i);
    const dueDate = dueMatch ? dueMatch[1].trim() : null;

    // 4. Line Items Table Parsing (Description, Quantity, Price, Total)
    const lineItems = [];
    const lineRegex = /([A-Za-z0-9\s]{4,30})\s+(\d+)\s+\$?([\d,]+\.\d{2})\s+\$?([\d,]+\.\d{2})/g;
    let match;
    while ((match = lineRegex.exec(rawText)) !== null) {
      lineItems.push({
        description: match[1].trim(),
        qty: parseInt(match[2], 10),
        unitPrice: parseFloat(match[3].replace(/,/g, '')),
        total: parseFloat(match[4].replace(/,/g, ''))
      });
    }

    // 5. Total and Tax
    const totalMatch = rawText.match(/(?:Grand Total|Total Due|Total):\s*\$?([\d,]+\.\d{2})/i);
    const grandTotal = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;

    // 6. Arithmetic Verification
    const calculatedSum = lineItems.reduce((acc, item) => acc + item.total, 0);
    const isReconciled = Math.abs(calculatedSum - grandTotal) < 0.05;

    return {
      invoiceNumber,
      vendor,
      dueDate,
      lineItems,
      grandTotal,
      calculatedSum,
      isReconciled,
      discrepancy: Math.abs(calculatedSum - grandTotal),
      accountingExport: {
        vendor_id: vendor.toUpperCase().replace(/\s+/g, '_'),
        invoice_ref: invoiceNumber,
        amount_cents: Math.round(grandTotal * 100),
        line_item_count: lineItems.length,
        status: isReconciled ? 'READY_FOR_SYNC' : 'FLAGGED_DISCREPANCY'
      }
    };
  }
}

module.exports = { PdfBusinessDataExtractor };
