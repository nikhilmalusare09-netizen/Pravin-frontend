/**
 * Utility to reliably print restaurant tax invoices / bills
 * Uses an isolated hidden iframe so printing is never clipped by modal overflow,
 * fixed positioning, or CSS transforms.
 */
export const printBillReceipt = (data) => {
  if (!data) return;

  const orderNumber = data.orderNumber || 'PC-ORDER';
  const tableNumber = data.tableNumber || '-';
  const customerName = data.customerName || data.name || 'Dine-in Guest';
  const customerPhone = data.customerPhone || data.customerMobile || data.phone || data.mobile || '';
  const displayMobile = customerPhone ? customerPhone : 'Not provided';
  const orderDateObj = new Date(data.orderDate || data.createdAt || Date.now());
  const formattedDate = orderDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = orderDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const restaurantName = data.restaurantName || 'PRAVIN CHINESE';
  const address = data.address || 'Shop No. 4, Food Court Lane, Main Market, Mumbai';
  const contact = data.contact || '+91 98765 43210';
  const gstin = data.gstin || '27AABCP1234F1Z8';

  const items = data.items || [];
  const subtotal = Number(data.subtotal || 0);
  const tax = Number(data.tax || 0);
  const cgst = (tax / 2).toFixed(2);
  const sgst = (tax / 2).toFixed(2);
  const totalAmount = Number(data.totalAmount || 0);
  const paymentStatus = (data.paymentStatus || 'PENDING').toUpperCase();
  const paymentMethod = data.paymentMethod ? data.paymentMethod.toUpperCase() : (paymentStatus === 'PAID' ? 'CASH' : '');
  const specialInstructions = data.specialInstructions || '';

  const itemsHtml = items.map((it, idx) => {
    const name = it.dishNameSnapshot || it.name || 'Dish Item';
    const qty = it.quantity || 1;
    const price = Number(it.unitPriceSnapshot || it.price || 0);
    const itemTotal = Number(it.itemTotal || qty * price);

    return `
      <tr>
        <td style="padding: 7px 4px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; font-size: 12px;">${name}</td>
        <td style="padding: 7px 4px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 12px;">${qty}</td>
        <td style="padding: 7px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155; font-size: 12px;">₹${price}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a; font-size: 12px;">₹${itemTotal}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${orderNumber}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bill-wrapper {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        body {
          background: #ffffff;
          color: #0f172a;
          padding: 16px;
          display: flex;
          justify-content: center;
        }
        .bill-wrapper {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 24px 28px;
        }
        .header {
          text-align: center;
          padding-bottom: 14px;
          border-bottom: 2px dashed #94a3b8;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #b91c1c;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #c2410c;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .restaurant-meta {
          font-size: 11px;
          color: #475569;
          margin-top: 6px;
          line-height: 1.4;
        }
        .invoice-pill {
          display: inline-block;
          margin-top: 10px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 3px 14px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #1e293b;
          text-transform: uppercase;
        }
        .meta-section {
          padding: 14px 0;
          border-bottom: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          line-height: 1.6;
        }
        .meta-col {
          flex: 1;
        }
        .meta-col.right {
          text-align: right;
        }
        .label {
          color: #64748b;
          font-weight: 500;
        }
        .val {
          color: #0f172a;
          font-weight: 700;
        }
        .val-highlight {
          color: #b91c1c;
          font-weight: 800;
          font-family: monospace;
          font-size: 13px;
        }
        .table-wrap {
          margin-top: 14px;
          width: 100%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          padding: 8px 4px;
          border-bottom: 2px solid #0f172a;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #475569;
        }
        .summary-box {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
          font-size: 12px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          color: #334155;
        }
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          padding: 10px 0;
          border-top: 2px solid #0f172a;
          border-bottom: 2px solid #0f172a;
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }
        .payment-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          font-size: 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-paid {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }
        .status-pending {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .instructions-box {
          margin-top: 12px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          font-size: 11px;
          color: #475569;
        }
        .footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 2px dashed #94a3b8;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          line-height: 1.5;
        }
        .footer-highlight {
          font-weight: 700;
          color: #0f172a;
        }
      </style>
    </head>
    <body>
      <div class="bill-wrapper">
        <!-- HEADER -->
        <div class="header">
          <div class="brand-title">${restaurantName}</div>
          <div class="brand-sub">Authentic Indo-Chinese Delicacies</div>
          <div class="restaurant-meta">
            ${address}<br />
            Tel: ${contact} &bull; GSTIN: ${gstin}
          </div>
          <div class="invoice-pill">Tax Invoice / Dining Bill</div>
        </div>

        <!-- ORDER & CUSTOMER METADATA -->
        <div class="meta-section">
          <div class="meta-col">
            <div><span class="label">Order No: </span><span class="val-highlight">${orderNumber}</span></div>
            <div><span class="label">Table: </span><span class="val">${tableNumber}</span></div>
            <div><span class="label">Customer Name: </span><span class="val">${customerName}</span></div>
            <div><span class="label">Mobile No: </span><span class="val">${displayMobile}</span></div>
          </div>
          <div class="meta-col right">
            <div><span class="label">Date: </span><span class="val">${formattedDate}</span></div>
            <div><span class="label">Time: </span><span class="val">${formattedTime}</span></div>
            <div><span class="label">Order Type: </span><span class="val">Dine-In</span></div>
            ${paymentMethod ? `<div><span class="label">Payment Mode: </span><span class="val">${paymentMethod}</span></div>` : ''}
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">#</th>
                <th>Dish / Item Description</th>
                <th style="width: 44px; text-align: center;">Qty</th>
                <th style="width: 70px; text-align: right;">Rate</th>
                <th style="width: 80px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- FINANCIAL SUMMARY -->
        <div class="summary-box">
          <div class="summary-row">
            <span>Subtotal</span>
            <span style="font-weight: 600;">₹${subtotal}</span>
          </div>
          <div class="summary-row" style="color: #64748b; font-size: 11px;">
            <span>CGST (2.5%)</span>
            <span>₹${cgst}</span>
          </div>
          <div class="summary-row" style="color: #64748b; font-size: 11px;">
            <span>SGST (2.5%)</span>
            <span>₹${sgst}</span>
          </div>
          <div class="summary-row">
            <span>Total GST (5%)</span>
            <span style="font-weight: 600;">₹${tax}</span>
          </div>

          <div class="grand-total-row">
            <span>Grand Total</span>
            <span>₹${totalAmount}</span>
          </div>

          <div class="payment-status-row">
            <span class="label">Payment Status:</span>
            <span class="status-badge ${paymentStatus === 'PAID' ? 'status-paid' : 'status-pending'}">
              ${paymentStatus === 'PAID' ? `PAID (${paymentMethod || 'SETTLED'})` : 'PENDING'}
            </span>
          </div>
        </div>

        ${specialInstructions ? `
          <div class="instructions-box">
            <strong>Notes / Instructions:</strong> ${specialInstructions}
          </div>
        ` : ''}

        <!-- FOOTER -->
        <div class="footer">
          <p class="footer-highlight">Thank you for dining at Pravin Chinese!</p>
          <p>Please visit again for hot wok delicacies & fresh flavors.</p>
          <p style="margin-top: 6px; font-size: 9px; color: #94a3b8;">This is a computer generated tax invoice. No signature required.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Use hidden iframe to avoid parent modal clipping or layout interference
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.setAttribute('title', 'Print Frame');

  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 300);
  } catch (e) {
    console.error('Error initiating print preview:', e);
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
    window.print();
  }
};
