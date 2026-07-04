const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateInvoicePDF(invoice, filePath) {
  return new Promise((resolve, reject) => {
    // Ne asigurăm că folderul există
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header: Emitent și Chiriaș
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("FACTURA FISCALA", 50, 50)
      .fontSize(10)
      .text(`Seria si Numarul: SANTA-${invoice.invoice_number}`, 50, 75)
      .text(`Data emiterii: ${new Date(invoice.issue_date).toLocaleDateString("ro-RO")}`, 50, 90)
      .text(`Data scadenta: ${new Date(invoice.due_date).toLocaleDateString("ro-RO")}`, 50, 105);

    // Date Emitent
    doc
      .text("Furnizor:", 50, 130)
      .font("Helvetica-Bold")
      .text("SANTA REAL ESTATE SRL", 50, 145)
      .font("Helvetica")
      .text("CUI: RO12345678", 50, 160)
      .text("Bucuresti, Sector 1", 50, 175);

    // Date Client
    doc
      .text("Client:", 300, 130)
      .font("Helvetica-Bold")
      .text(invoice.tenant_name || "N/A", 300, 145)
      .font("Helvetica")
      .text(`CUI: ${invoice.tenant_cui || "-"}`, 300, 160)
      .text(`Adresa: ${invoice.tenant_address || "-"}`, 300, 175);

    doc.moveDown(3);

    // Tabel Linii
    const tableTop = 230;
    doc.font("Helvetica-Bold");
    doc.text("Descriere", 50, tableTop);
    doc.text("Valoare (RON)", 400, tableTop, { width: 90, align: "right" });

    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

    doc.font("Helvetica");
    const rowTop = tableTop + 25;

    // Bază chirie
    doc.text(`Chirie lunara cf. contract ${invoice.contract_number} + Utilitati`, 50, rowTop);
    const rentRon = parseFloat(invoice.rent_ron) || 0;
    const utilitiesRon = parseFloat(invoice.utilities_ron) || 0;
    const vatRon = parseFloat(invoice.vat_ron) || 0;
    const baseVal = (rentRon + utilitiesRon).toFixed(2);
    doc.text(baseVal, 400, rowTop, { width: 90, align: "right" });

    // Rând TVA
    let currentTop = rowTop + 15;
    let baseSum = rentRon + utilitiesRon;
    let vatPercent = baseSum > 0 ? Math.round((vatRon / baseSum) * 100) : 21;
    doc.text(`TVA (${vatPercent}%)`, 50, currentTop);
    doc.text(vatRon.toFixed(2), 400, currentTop, { width: 90, align: "right" });

    if (invoice.penalty_ron && parseFloat(invoice.penalty_ron) > 0) {
      currentTop += 15;
      doc.fillColor("#cc0000").text("Penalitati de intarziere (1% / zi)", 50, currentTop);
      doc.text(`+${parseFloat(invoice.penalty_ron).toFixed(2)}`, 400, currentTop, { width: 90, align: "right" });
      doc.fillColor("#000000");
    }

    doc.moveTo(50, currentTop + 15).lineTo(500, currentTop + 15).stroke();

    // Total
    doc.moveDown(2);
    doc.font("Helvetica-Bold");
    doc.text(`Total de plata: ${invoice.total_ron} RON`, 300, currentTop + 30, { align: "right" });

    // Footer
    doc.font("Helvetica").fontSize(10);
    doc.text(
      "Factura este valabila fara semnatura si stampila.",
      50,
      700,
      { align: "center", width: 500 }
    );

    doc.end();

    stream.on("finish", () => {
      resolve(filePath);
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = {
  generateInvoicePDF,
};
