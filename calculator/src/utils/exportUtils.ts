import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RoomData, MaterialResult, SavedEstimate } from '../types';

// Enhanced PDF Export
export const exportToPDF = (
  rooms: RoomData[], 
  materialResults: Record<string, MaterialResult | null>,
  estimateName?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Строительная смета', pageWidth / 2, 20, { align: 'center' });
  
  if (estimateName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(estimateName, pageWidth / 2, 30, { align: 'center' });
  }
  
  doc.setFontSize(10);
  doc.text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, pageWidth / 2, 40, { align: 'center' });
  
  let yPosition = 60;
  
  // Room details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Параметры помещений', 20, yPosition);
  yPosition += 10;
  
  rooms.forEach((room, index) => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${room.name}`, 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Размеры: ${room.length} × ${room.width} × ${room.height} ${room.unit}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Площадь пола: ${(parseFloat(room.length) * parseFloat(room.width)).toFixed(2)} м²`, 30, yPosition);
    yPosition += 6;
    doc.text(`Периметр: ${((parseFloat(room.length) + parseFloat(room.width)) * 2).toFixed(2)} м`, 30, yPosition);
    yPosition += 6;
    doc.text(`Площадь стен: ${((parseFloat(room.length) + parseFloat(room.width)) * 2 * parseFloat(room.height)).toFixed(2)} м²`, 30, yPosition);
    yPosition += 10;
    
    if (room.openings.length > 0) {
      doc.text('Проемы:', 30, yPosition);
      yPosition += 6;
      room.openings.forEach(opening => {
        doc.text(`- ${opening.type === 'window' ? 'Окно' : 'Дверь'}: ${opening.width} × ${opening.height} м (${opening.count} шт.)`, 40, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }
  });
  
  // Materials table
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Расчет материалов', 20, yPosition);
  yPosition += 15;
  
  const materialsData = Object.entries(materialResults)
    .filter(([_, result]) => result !== null)
    .map(([name, result]) => [
      name,
      result!.quantity,
      `${result!.cost.toFixed(2)} ₽`
    ]);
  
  if (materialsData.length > 0) {
    (doc as any).autoTable({
      head: [['Материал', 'Количество', 'Стоимость']],
      body: materialsData,
      startY: yPosition,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [51, 144, 236] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Total cost
  const totalCost = Object.values(materialResults).reduce((sum, result) => sum + (result?.cost || 0), 0);
  
  if (yPosition > pageHeight - 30) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Общая стоимость: ${totalCost.toFixed(2)} ₽`, pageWidth / 2, yPosition, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Создано с помощью Строительного калькулятора', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.save(`smetа_${estimateName || 'расчет'}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Excel Export
export const exportToExcel = (
  rooms: RoomData[], 
  materialResults: Record<string, MaterialResult | null>,
  estimateName?: string
) => {
  const workbook = XLSX.utils.book_new();
  
  // Room details sheet
  const roomData = rooms.map((room, index) => ({
    '№': index + 1,
    'Название': room.name,
    'Длина (м)': parseFloat(room.length),
    'Ширина (м)': parseFloat(room.width),
    'Высота (м)': parseFloat(room.height),
    'Площадь пола (м²)': parseFloat(room.length) * parseFloat(room.width),
    'Периметр (м)': (parseFloat(room.length) + parseFloat(room.width)) * 2,
    'Площадь стен (м²)': (parseFloat(room.length) + parseFloat(room.width)) * 2 * parseFloat(room.height),
    'Количество окон': room.openings.filter(o => o.type === 'window').length,
    'Количество дверей': room.openings.filter(o => o.type === 'door').length
  }));
  
  const roomSheet = XLSX.utils.json_to_sheet(roomData);
  XLSX.utils.book_append_sheet(workbook, roomSheet, 'Помещения');
  
  // Materials sheet
  const materialsData = Object.entries(materialResults)
    .filter(([_, result]) => result !== null)
    .map(([name, result]) => ({
      'Материал': name,
      'Количество': result!.quantity,
      'Стоимость (₽)': result!.cost,
      'Детали': JSON.stringify(result!.details)
    }));
  
  if (materialsData.length > 0) {
    const materialsSheet = XLSX.utils.json_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(workbook, materialsSheet, 'Материалы');
  }
  
  // Summary sheet
  const totalCost = Object.values(materialResults).reduce((sum, result) => sum + (result?.cost || 0), 0);
  const totalFloorArea = rooms.reduce((sum, room) => sum + (parseFloat(room.length) * parseFloat(room.width)), 0);
  const totalWallArea = rooms.reduce((sum, room) => sum + ((parseFloat(room.length) + parseFloat(room.width)) * 2 * parseFloat(room.height)), 0);
  
  const summaryData = [
    { 'Параметр': 'Название расчета', 'Значение': estimateName || 'Без названия' },
    { 'Параметр': 'Дата создания', 'Значение': new Date().toLocaleDateString('ru-RU') },
    { 'Параметр': 'Количество помещений', 'Значение': rooms.length },
    { 'Параметр': 'Общая площадь пола (м²)', 'Значение': totalFloorArea.toFixed(2) },
    { 'Параметр': 'Общая площадь стен (м²)', 'Значение': totalWallArea.toFixed(2) },
    { 'Параметр': 'Общая стоимость (₽)', 'Значение': totalCost.toFixed(2) },
    { 'Параметр': 'Стоимость за м² пола (₽)', 'Значение': (totalCost / totalFloorArea).toFixed(2) },
    { 'Параметр': 'Стоимость за м² стен (₽)', 'Значение': (totalCost / totalWallArea).toFixed(2) }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');
  
  // Save file
  XLSX.writeFile(workbook, `smetа_${estimateName || 'расчет'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// JSON Export
export const exportToJSON = (
  rooms: RoomData[], 
  materialResults: Record<string, MaterialResult | null>,
  estimateName?: string
) => {
  const exportData = {
    metadata: {
      name: estimateName || 'Без названия',
      createdAt: new Date().toISOString(),
      version: '1.0',
      app: 'Строительный калькулятор'
    },
    rooms: rooms.map(room => ({
      ...room,
      calculations: {
        floorArea: parseFloat(room.length) * parseFloat(room.width),
        perimeter: (parseFloat(room.length) + parseFloat(room.width)) * 2,
        wallArea: (parseFloat(room.length) + parseFloat(room.width)) * 2 * parseFloat(room.height)
      }
    })),
    materials: Object.entries(materialResults)
      .filter(([_, result]) => result !== null)
      .map(([name, result]) => ({
        name,
        ...result
      })),
    summary: {
      totalCost: Object.values(materialResults).reduce((sum, result) => sum + (result?.cost || 0), 0),
      totalFloorArea: rooms.reduce((sum, room) => sum + (parseFloat(room.length) * parseFloat(room.width)), 0),
      totalWallArea: rooms.reduce((sum, room) => sum + ((parseFloat(room.length) + parseFloat(room.width)) * 2 * parseFloat(room.height)), 0),
      roomCount: rooms.length,
      materialCount: Object.values(materialResults).filter(result => result !== null).length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `smetа_${estimateName || 'расчет'}_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  
  URL.revokeObjectURL(link.href);
};

// Telegram Export
export const exportToTelegram = (
  rooms: RoomData[], 
  materialResults: Record<string, MaterialResult | null>,
  estimateName?: string
) => {
  const totalCost = Object.values(materialResults).reduce((sum, result) => sum + (result?.cost || 0), 0);
  const totalFloorArea = rooms.reduce((sum, room) => sum + (parseFloat(room.length) * parseFloat(room.width)), 0);
  
  let message = `🏗️ *${estimateName || 'Строительная смета'}*\n\n`;
  message += `📅 Дата: ${new Date().toLocaleDateString('ru-RU')}\n`;
  message += `🏠 Помещений: ${rooms.length}\n`;
  message += `📐 Площадь пола: ${totalFloorArea.toFixed(2)} м²\n\n`;
  
  message += `💰 *Материалы:*\n`;
  Object.entries(materialResults)
    .filter(([_, result]) => result !== null)
    .forEach(([name, result]) => {
      message += `• ${name}: ${result!.quantity} - ${result!.cost.toFixed(2)} ₽\n`;
    });
  
  message += `\n💵 *Общая стоимость: ${totalCost.toFixed(2)} ₽*\n`;
  message += `📊 Стоимость за м²: ${(totalCost / totalFloorArea).toFixed(2)} ₽\n\n`;
  message += `_Создано с помощью Строительного калькулятора_`;
  
  // Send to Telegram if available
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.sendData(message);
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      alert('Данные скопированы в буфер обмена!');
    }).catch(() => {
      alert('Данные для отправки:\n\n' + message);
    });
  }
};


