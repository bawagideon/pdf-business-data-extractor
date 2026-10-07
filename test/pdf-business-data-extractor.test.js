const { test } = require('node:test');
const assert = require('node:assert');
const { PdfBusinessDataExtractor } = require('../src/index.js');

test('PdfBusinessDataExtractor: extracts invoice headers and validates line arithmetic', () => {
  const extractor = new PdfBusinessDataExtractor();
  const rawInvoice = `
    Vendor: CloudScale Infrastructure Inc
    Invoice: INV-2026-992
    Due Date: 2026-11-15
    Dedicated Hosting Server    2   1500.00   3000.00
    Managed Database Node       1    850.00    850.00
    Total: $3850.00
  `;

  const res = extractor.extractInvoiceText(rawInvoice);
  assert.strictEqual(res.invoiceNumber, 'INV-2026-992');
  assert.strictEqual(res.vendor, 'CloudScale Infrastructure Inc');
  assert.strictEqual(res.lineItems.length, 2);
  assert.strictEqual(res.grandTotal, 3850);
  assert.strictEqual(res.isReconciled, true);
  assert.strictEqual(res.accountingExport.status, 'READY_FOR_SYNC');
});

test('PdfBusinessDataExtractor: flags discrepancy when sum does not equal grand total', () => {
  const extractor = new PdfBusinessDataExtractor();
  const rawInvoice = `
    Vendor: Faulty Supplies Ltd
    Invoice: INV-FAIL-1
    Security Consulting          1   2000.00   2000.00
    Total: $2500.00
  `;

  const res = extractor.extractInvoiceText(rawInvoice);
  assert.strictEqual(res.isReconciled, false);
  assert.strictEqual(res.accountingExport.status, 'FLAGGED_DISCREPANCY');
});
