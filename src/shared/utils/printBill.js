import moment from 'moment'

/**
 * Generates and triggers a print preview / PDF download for a Chick Blast order bill.
 * Uses an invisible iframe to avoid popup-blocker issues and provides a clean,
 * restaurant-grade thermal/A4 printable invoice layout.
 */
export function printOrderBill(order) {
  if (!order) return

  const orderNo = order.orderNo || (order.id ? String(order.id).split('-').pop() : '1')
  const invoiceNo = `CB-INV-${String(orderNo).padStart(5, '0')}`
  const orderDate = order.createdAt
    ? moment(order.createdAt).format('DD MMM YYYY, hh:mm A')
    : moment().format('DD MMM YYYY, hh:mm A')

  const totalItemCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0
  const subtotal = order.subtotal || order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || order.totalAmount || 0
  const tax = Number(order.tax || 0)
  const deliveryFee = order.deliveryFee !== undefined ? Number(order.deliveryFee) : 0
  const discountAmount = Number(order.discountAmount || 0)
  const totalAmount = Number(order.totalAmount || 0)

  const paymentMode = order.payment?.mode
    ? String(order.payment.mode).toUpperCase()
    : 'PAID (ONLINE/CASH)'

  const itemsHtml = (order.items || [])
    .map((item, idx) => {
      const isVeg = item.label === 'Veg'
      const vegDot = isVeg
        ? '<span style="color:#16a34a; font-weight:bold; font-size:11px;">[VEG]</span>'
        : '<span style="color:#dc2626; font-weight:bold; font-size:11px;">[NON-VEG]</span>'
      const itemTotal = ((item.price || 0) * (item.quantity || 1)).toFixed(2)
      const components = item.components?.length
        ? `<div style="font-size:10px; color:#64748b; padding-left:8px; margin-top:2px;">${item.components
            .map((c) => `↳ ${c.name} (x${c.quantity})`)
            .join(', ')}</div>`
        : ''

      return `
        <tr>
          <td style="padding: 8px 4px; border-bottom: 1px dashed #e2e8f0; vertical-align: top;">
            <div style="font-weight: 700; color: #0f172a;">${idx + 1}. ${item.name} ${vegDot}</div>
            ${components}
          </td>
          <td style="padding: 8px 4px; border-bottom: 1px dashed #e2e8f0; text-align: center; vertical-align: top; font-weight: 600; color: #334155;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 8px 4px; border-bottom: 1px dashed #e2e8f0; text-align: right; vertical-align: top; color: #64748b;">
            ₹${Number(item.price || 0).toFixed(2)}
          </td>
          <td style="padding: 8px 4px; border-bottom: 1px dashed #e2e8f0; text-align: right; vertical-align: top; font-weight: 700; color: #0f172a;">
            ₹${itemTotal}
          </td>
        </tr>
      `
    })
    .join('')

  const billHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Chick Blast Tax Invoice - #${orderNo}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 4mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        body {
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background: #f8fafc;
          font-size: 12px;
          line-height: 1.4;
          display: flex;
          justify-content: center;
        }
        .invoice-card {
          width: 100%;
          max-width: 380px;
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .header {
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 2px dashed #cbd5e1;
          margin-bottom: 12px;
        }
        .brand-name {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #ea580c;
          margin: 0;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #64748b;
          text-transform: uppercase;
          margin: 2px 0 6px 0;
        }
        .store-info {
          font-size: 10px;
          color: #64748b;
          margin: 0;
        }
        .badge-delivered {
          display: inline-block;
          background: #ecfdf5;
          color: #059669;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid #a7f3d0;
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 8px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 11px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-size: 9px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-value {
          font-weight: 700;
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        th {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          padding: 6px 4px;
          border-bottom: 1px solid #cbd5e1;
        }
        .calc-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 11px;
          color: #475569;
        }
        .calc-row.discount {
          color: #059669;
          font-weight: 600;
        }
        .grand-total-box {
          margin-top: 10px;
          padding: 10px 12px;
          background: #0f172a;
          color: #ffffff;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .grand-total-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grand-total-amount {
          font-size: 18px;
          font-weight: 900;
          color: #ffffff;
        }
        .payment-box {
          margin-top: 10px;
          padding: 8px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 10px;
          display: flex;
          justify-content: space-between;
          color: #475569;
        }
        .footer {
          margin-top: 14px;
          text-align: center;
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
          color: #64748b;
          font-size: 10px;
        }
        .footer-heart {
          color: #ea580c;
          font-weight: 800;
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <!-- Store Header -->
        <div class="header">
          <h1 class="brand-name">🍗 CHICK BLAST</h1>
          <p class="brand-sub">Express Kitchen & Restaurant</p>
          <p class="store-info">Authentic Crispy Chicken, Burgers & Snacks</p>
          <p class="store-info">FSSAI Lic No: 12423000000000</p>
          <div>
            <span class="badge-delivered">✔ Successfully Delivered</span>
          </div>
        </div>

        <!-- Order & Customer Meta Details -->
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Invoice No</span>
            <span class="meta-value">${invoiceNo}</span>
          </div>
          <div class="meta-item" style="text-align: right;">
            <span class="meta-label">Order No</span>
            <span class="meta-value" style="color: #ea580c; font-size: 13px;">#${orderNo}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Customer Name</span>
            <span class="meta-value">${order.customerName || 'Guest Customer'}</span>
          </div>
          <div class="meta-item" style="text-align: right;">
            <span class="meta-label">Mobile</span>
            <span class="meta-value">+91 ${order.customerMobile || 'N/A'}</span>
          </div>
          <div class="meta-item" style="grid-column: span 2;">
            <span class="meta-label">Date & Time</span>
            <span class="meta-value">${orderDate}</span>
          </div>
        </div>

        <!-- Ordered Items Table -->
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Calculations -->
        <div style="padding-top: 6px; border-top: 1px dashed #e2e8f0;">
          <div class="calc-row">
            <span>Items Subtotal (${totalItemCount} items)</span>
            <span style="font-weight: 600;">₹${Number(subtotal).toFixed(2)}</span>
          </div>
          ${
            tax > 0
              ? `
            <div class="calc-row">
              <span>GST (5%)</span>
              <span style="font-weight: 600;">₹${tax.toFixed(2)}</span>
            </div>
          `
              : ''
          }
          ${
            deliveryFee !== undefined
              ? `
            <div class="calc-row">
              <span>Delivery Fee</span>
              <span style="font-weight: 600;">${deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
            </div>
          `
              : ''
          }
          ${
            discountAmount > 0
              ? `
            <div class="calc-row discount">
              <span>Coupon Discount ${order.discountCode ? `(${order.discountCode})` : ''}</span>
              <span>-₹${discountAmount.toFixed(2)}</span>
            </div>
          `
              : ''
          }
        </div>

        <!-- Grand Total -->
        <div class="grand-total-box">
          <div>
            <div class="grand-total-label">Grand Total</div>
            <div style="font-size: 9px; opacity: 0.8;">Incl. all taxes & fees</div>
          </div>
          <div class="grand-total-amount">₹${totalAmount.toFixed(2)}</div>
        </div>

        <!-- Payment Meta -->
        <div class="payment-box">
          <span><strong>Payment Mode:</strong> ${paymentMode}</span>
          <span style="color: #059669; font-weight: 700;">PAID ✔</span>
        </div>

        <!-- Thank you Footer -->
        <div class="footer">
          <p style="margin: 0; font-weight: 700; color: #1e293b;">Thank You For Dining With Chick Blast! <span class="footer-heart">🍗</span></p>
          <p style="margin: 4px 0 0 0;">For feedback or support, please visit store counter.</p>
          <p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8;">Computer Generated Tax Invoice • Official Customer Bill</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Use hidden iframe for seamless print without popup blockage
  let iframe = document.getElementById('cb-print-bill-iframe')
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = 'cb-print-bill-iframe'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0px'
    iframe.style.height = '0px'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)
  }

  const iframeDoc = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument
  iframeDoc.document.open()
  iframeDoc.document.write(billHtml)
  iframeDoc.document.close()

  // Wait for resources to load before calling print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (e) {
      console.warn('Iframe print failed, falling back to window print', e)
      const printWin = window.open('', '_blank')
      if (printWin) {
        printWin.document.write(billHtml)
        printWin.document.close()
        printWin.focus()
        printWin.print()
        printWin.close()
      }
    }
  }, 250)
}
