const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function normalizeText(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/Ș|Ş/g, "S")
    .replace(/ș|ş/g, "s")
    .replace(/Ț|Ţ/g, "T")
    .replace(/ț|ţ/g, "t")
    .replace(/Ă/g, "A")
    .replace(/ă/g, "a")
    .replace(/Î/g, "I")
    .replace(/î/g, "i")
    .replace(/Â/g, "A")
    .replace(/â/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function generateInvoicePDF(invoice, filePath) {
  return new Promise((resolve, reject) => {
    const inv = {};
    for (const key in invoice) {
      if (typeof invoice[key] === "string") {
        inv[key] = normalizeText(invoice[key]);
      } else {
        inv[key] = invoice[key];
      }
    }

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
      .text(`Seria si Numarul: SANTA-${inv.invoice_number}`, 50, 75)
      .text(`Data emiterii: ${new Date(inv.issue_date).toLocaleDateString("ro-RO")}`, 50, 90)
      .text(`Data scadenta: ${new Date(inv.due_date).toLocaleDateString("ro-RO")}`, 50, 105);

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
      .text(inv.tenant_name || "N/A", 300, 145)
      .font("Helvetica")
      .text(`CUI: ${inv.tenant_cui || "-"}`, 300, 160)
      .text(`Adresa: ${inv.tenant_address || "-"}`, 300, 175);

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
    doc.text(`Chirie lunara cf. contract ${inv.contract_number} + Utilitati`, 50, rowTop);
    const rentRon = parseFloat(inv.rent_ron) || 0;
    const utilitiesRon = parseFloat(inv.utilities_ron) || 0;
    const vatRon = parseFloat(inv.vat_ron) || 0;
    const baseVal = (rentRon + utilitiesRon).toFixed(2);
    doc.text(baseVal, 400, rowTop, { width: 90, align: "right" });

    // Rând TVA
    let currentTop = rowTop + 15;
    let baseSum = rentRon + utilitiesRon;
    let vatPercent = baseSum > 0 ? Math.round((vatRon / baseSum) * 100) : 21;
    doc.text(`TVA (${vatPercent}%)`, 50, currentTop);
    doc.text(vatRon.toFixed(2), 400, currentTop, { width: 90, align: "right" });

    if (inv.penalty_ron && parseFloat(inv.penalty_ron) > 0) {
      currentTop += 15;
      doc.fillColor("#cc0000").text("Penalitati de intarziere (1% / zi)", 50, currentTop);
      doc.text(`+${parseFloat(inv.penalty_ron).toFixed(2)}`, 400, currentTop, { width: 90, align: "right" });
      doc.fillColor("#000000");
    }

    doc.moveTo(50, currentTop + 15).lineTo(500, currentTop + 15).stroke();

    // Total
    doc.moveDown(2);
    doc.font("Helvetica-Bold");
    doc.text(`Total de plata: ${inv.total_ron} RON`, 300, currentTop + 30, { align: "right" });

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

function generateContractPDF(contract, filePath) {
  return new Promise((resolve, reject) => {
    const ctr = {};
    for (const key in contract) {
      if (typeof contract[key] === "string") {
        ctr[key] = normalizeText(contract[key]);
      } else {
        ctr[key] = contract[key];
      }
    }

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Titlu
    doc
      .fillColor("#111111")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("CONTRACT DE INCHIRIERE SPATIU COMERCIAL / BIROU", { align: "center" })
      .fontSize(11)
      .text(`Nr. ${ctr.contract_number || "DRAFT"} / Data: ${new Date(ctr.start_date || Date.now()).toLocaleDateString("ro-RO")}`, { align: "center" });

    doc.moveDown(1.5);

    // Capitolul I. Partile contractante
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("I. PARTILE CONTRACTANTE", { underline: true });
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text("1. PROPRIETAR (Locator): SANTA REAL ESTATE SRL, cu sediul in Bucuresti, Sector 1, CUI: RO12345678, reprezentata legal prin administrator.", { align: "justify" });
    doc.moveDown(0.5);
    doc
      .text(`2. CHIRIAS (Locatar): ${ctr.tenant_name || "N/A"}, CUI/CNP: ${ctr.tenant_cui || "-"}, cu sediul/adresa in ${ctr.tenant_address || "-"}, reprezentat legal prin ${ctr.legal_rep_name || "reprezentant legal"}.`, { align: "justify" });

    doc.moveDown(1);

    // Capitolul II. Obiectul contractului
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("II. OBIECTUL CONTRACTULUI", { underline: true });
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Proprietarul inchirieaza, iar Chiriasul ia in chirie imobilul/spatiul denumit "${ctr.property_title || "-"}", situat in ${ctr.property_address || "-"}, avand suprafata de ${ctr.property_area || "-"} mp, in scopul desfasurarii de activitati comerciale si de birou conform specificului activitatii Chiriasului.`, { align: "justify" });

    doc.moveDown(1);

    // Capitolul III. Durata contractului
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("III. DURATA CONTRACTULUI", { underline: true });
    doc.moveDown(0.5);
    const startStr = ctr.start_date ? new Date(ctr.start_date).toLocaleDateString("ro-RO") : "-";
    const endStr = ctr.end_date ? new Date(ctr.end_date).toLocaleDateString("ro-RO") : "-";
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Prezentul contract intra in vigoare la data de ${startStr} si este valabil pana la data de ${endStr}. Contractul poate fi prelungit prin act aditional semnat de ambele parti cu cel putin 30 de zile inainte de expirare.`, { align: "justify" });

    doc.moveDown(1);

    // Capitolul IV. Chiria si modalitatile de plata
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("IV. CHIRIA SI MODALITATEA DE PLATA", { underline: true });
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`1. Chiria lunara pentru folosinta spatiului este de ${ctr.monthly_rent_eur || 0} EUR/luna (la care se adauga TVA conform legii).`, { align: "justify" });
    doc.moveDown(0.3);
    doc
      .text(`2. Chiriasul va achita suplimentar costurile de utilitati si mentenanta estimate la suma de ${ctr.utilities_ron || 0} RON/luna.`, { align: "justify" });
    doc.moveDown(0.3);
    doc
      .text(`3. Plata se va efectua lunar in lei, la cursul BNR din ziua emiterii facturii, pana la data de ${ctr.billing_day || 1} a fiecarei luni pentru luna in curs. In caz de intarziere se aplica penalitati de 1%/zi de intarziere.`, { align: "justify" });
    doc.moveDown(0.3);
    doc
      .text(`4. La semnarea contractului, Chiriasul constituie o garantie de buna executie in valoare de ${ctr.deposit_eur || 0} EUR.`, { align: "justify" });

    doc.moveDown(1);

    // Capitolul V. Obligatiile partilor
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("V. OBLIGATIILE PRINCIPALE ALE PARTILOR", { underline: true });
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Locatorul se obliga sa predea spatiul in stare buna de functionare, sa asigure accesul si folosinta linistita pe toata durata contractului si sa efectueze reparatiile capitale ce cad in sarcina sa.", { align: "justify" });
    doc.moveDown(0.3);
    doc
      .text("Locatarul se obliga sa foloseasca spatiul ca un bun proprietar, sa achite chiria si utilitatile la termen, sa pastreze curatenia, sa efectueze reparatiile curente de intretinere si sa nu subinchirieze spatiul fara acordul scris al Locatorului.", { align: "justify" });

    doc.moveDown(1.5);

    // Capitolul VI. Semnaturile
    const signY = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("LOCATOR,", 50, signY)
      .text("LOCATAR,", 350, signY);

    const compY = doc.y + 10;
    doc
      .font("Helvetica")
      .text("SANTA REAL ESTATE SRL", 50, compY)
      .text(`${ctr.tenant_name || "Chirias"}`, 350, compY);

    const repY = doc.y + 5;
    doc
      .text("Reprezentant legal", 50, repY)
      .text(`${ctr.legal_rep_name || "Reprezentant legal"}`, 350, repY);

    doc.moveDown(3);
    doc
      .fontSize(9)
      .fillColor("#666666")
      .text("Prezentul contract a fost generat electronic din platforma SANTA Real Estate Management si produce efecte juridice conform acordului partilor.", 50, doc.y, { align: "center", width: 500 });

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
  generateContractPDF,
};
