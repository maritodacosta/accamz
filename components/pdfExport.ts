
import { AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to get image dimensions for perfect aspect ratio
const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = base64;
  });
};

export const exportToPDF = async (
  title: string, 
  headers: string[], 
  data: any[][], 
  settings: AppSettings, 
  branch: string,
  summary?: { label: string; value: string; color?: string }[]
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const t = TRANSLATIONS[settings.language];

  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // 1. HEADER SECTION - LOGO HANDLING WITH ASPECT RATIO
  if (settings.companyLogo) {
    try {
      const dimensions = await getImageDimensions(settings.companyLogo);
      if (dimensions.width > 0) {
        // Set maximum bounds for logo (40mm wide or 22mm high)
        const maxWidth = 40;
        const maxHeight = 22;
        let finalWidth = maxWidth;
        let finalHeight = (dimensions.height * maxWidth) / dimensions.width;

        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = (dimensions.width * maxHeight) / dimensions.height;
        }

        doc.addImage(settings.companyLogo, 'PNG', margin, 15, finalWidth, finalHeight, undefined, 'FAST');
      }
    } catch (e) {
      console.warn("Could not add logo to PDF", e);
    }
  } else {
    // Elegant Placeholder
    doc.setFillColor(15, 23, 42); 
    doc.roundedRect(margin, 15, 12, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ERP', margin + 2.5, 22.5);
  }

  // Company Info (Right Aligned)
  doc.setTextColor(15, 23, 42); 
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(settings.companyName.toUpperCase(), pageWidth - margin, 20, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); 
  
  let currentY = 26;
  if (settings.companyAddress) {
    const splitAddress = doc.splitTextToSize(settings.companyAddress, 80);
    doc.text(splitAddress, pageWidth - margin, currentY, { align: 'right' });
    currentY += (splitAddress.length * 4);
  }
  
  const contactLines = [];
  if (settings.companyPhone) contactLines.push(`Tel: ${settings.companyPhone}`);
  if (settings.companyEmail) contactLines.push(`Email: ${settings.companyEmail}`);
  
  if (contactLines.length > 0) {
    doc.text(contactLines.join('  |  '), pageWidth - margin, currentY, { align: 'right' });
  }

  // Decorative Horizontal line
  doc.setDrawColor(30, 41, 59); 
  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);

  // 2. REPORT METADATA
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), margin, 55);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`CABANG: ${branch.toUpperCase()}`, margin, 60);
  doc.text(`TANGGAL CETAK: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - margin, 60, { align: 'right' });

  // 3. TABLE SECTION - NO FOOTER
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 68,
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 3,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      [headers.length - 1]: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin, bottom: 20 }, // Increased bottom margin but no content drawn there
  });

  // 4. SUMMARY SECTION
  if (summary && summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if summary fits on page
    if (finalY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        doc.text("SUMMARY CONTINUED", margin, 20);
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageWidth - margin - 80, finalY, 80, (summary.length * 8) + 5, 2, 2, 'F');
    
    summary.forEach((item, index) => {
      const yPos = finalY + 7 + (index * 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, pageWidth - margin - 75, yPos);
      
      if (index === summary.length - 1) {
        doc.setTextColor(79, 70, 229); 
        doc.setFontSize(10);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      
      doc.text(item.value, pageWidth - margin - 5, yPos, { align: 'right' });
    });
  }

  const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_export.pdf`;
  doc.save(fileName);
};