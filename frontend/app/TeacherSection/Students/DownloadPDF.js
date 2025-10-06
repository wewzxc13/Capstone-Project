"use client";
import React from "react";
import jsPDF from 'jspdf';

// Shared jsPDF generator used by both Assessment and Status tabs
export async function generateAssessmentPDF({
  student = {},
  parentProfile = {},
  studentLevelData = {},
  advisory = {},
  attendanceData = [],
  subjects = [],
  quarterFeedback = [],
  progressCards = [],
  finalSubjectProgress = [],
  overallProgress = null,
  visualFeedback = [],
  comments = [],
  milestoneSummary = null,
  milestoneOverallSummary = null,
  quarters = [
    { id: 1, name: '1st Quarter' },
    { id: 2, name: '2nd Quarter' },
    { id: 3, name: '3rd Quarter' },
    { id: 4, name: '4th Quarter' },
    { id: 5, name: 'Final' },
  ]
}) {
  // The implementation mirrors the Assessment tab's jsPDF generator,
  // refactored to use passed-in data. It draws page-by-page to keep
  // memory low and avoid timeouts.

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 295;
  let currentY = 20;

  const formatDateOfBirth = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatName = (fullName) => {
    if (!fullName) return '—';
    const special = ['Not assigned','Not Assigned','not assigned','N/A','n/a','None','none','TBD','tbd'];
    if (special.includes(String(fullName).trim())) return String(fullName).trim();
    const parts = String(fullName).trim().split(' ');
    if (parts.length < 2) return String(fullName);
    const last = parts[parts.length - 1];
    const first = parts[0];
    const middle = parts.slice(1, -1).join(' ');
    return middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;
  };

  const computeAge = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const diff = Date.now() - d.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const buildParentName = (profile, prefix) => {
    if (!profile) return '';
    const direct = profile[`${prefix}_name`] || profile[`${prefix}Name`];
    const first = profile[`${prefix}_firstname`] || profile[`${prefix}_first_name`] || profile[`${prefix}_first`] || profile[`${prefix}_fname`] || profile[`${prefix}FirstName`];
    const middle = profile[`${prefix}_middlename`] || profile[`${prefix}_middle_name`] || profile[`${prefix}_mname`] || profile[`${prefix}MiddleName`];
    const last = profile[`${prefix}_lastname`] || profile[`${prefix}_last_name`] || profile[`${prefix}_lname`] || profile[`${prefix}LastName`];
    if (direct && String(direct).trim()) return String(direct).trim();
    return [first, middle, last].filter(Boolean).map(v => String(v).trim()).join(' ');
  };

  const getParentAge = (profile, prefix) => {
    if (!profile) return '';
    const age = profile[`${prefix}_age`] || profile[`${prefix}Age`];
    if (age) return String(age);
    const bday = profile[`${prefix}_birthdate`] || profile[`${prefix}_dob`] || profile[`${prefix}Birthdate`];
    const computed = computeAge(bday);
    return Number.isFinite(computed) ? String(computed) : '';
  };

  const getParentOccupation = (profile, prefix) => {
    if (!profile) return '';
    return profile[`${prefix}_occupation`] || profile[`${prefix}Occupation`] || '';
  };

  const pdfShapeColorMap = {
    '❤️': [244, 67, 54], '❤': [244, 67, 54], '♥': [244, 67, 54],
    '■': [0, 188, 212], '⭐': [255, 152, 0], '★': [255, 152, 0],
    '⬢': [205, 220, 57], '🔷': [33, 150, 243], '◆': [33, 150, 243],
    '▲': [76, 175, 80], '🟡': [255, 235, 59], '●': [255, 235, 59], '⬤': [255, 235, 59],
  };

  const toUnicodeShape = (raw) => {
    const s = (raw ?? '').toString().trim();
    if (!s) return '';
    if (['♥','❤','❤️','★','⭐','◆','🔷','▲','⬤','●','■','⬢'].includes(s)) {
      if (s === '●') return '⬤';
      if (s === '❤️' || s === '♥') return '❤';
      if (s === '⭐') return '★';
      if (s === '🔷') return '◆';
      return s;
    }
    const map = { '&e': '★', '&E': '★', '%Æ': '◆', '&c': '◆', '%²': '▲', '&t': '▲', '%I': '⬤', '&o': '⬤', '[]': '■', '+^': '⬢' };
    return map[s] || s;
  };

  const renderSymbol = (symbol, x, y, fontSize = 12) => {
    if (!symbol) return;
    const finalSymbol = toUnicodeShape(symbol);
    const rgb = pdfShapeColorMap[finalSymbol] || [0, 0, 0];
    const size = fontSize * 0.8;
    const r = size / 3.2;
    const cx = x;
    const cy = y;
    pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.setLineWidth(0.6);
    switch (finalSymbol) {
      case '⬤': pdf.circle(cx, cy, r * 1.25, 'F'); break;
      case '▲': {
        const h = r * 2.1;
        pdf.triangle(cx, cy - h / 1.3, cx - r * 1.2, cy + h / 2.2, cx + r * 1.2, cy + h / 2.2, 'F');
        break;
      }
      case '❤': {
        const cyh = cy - r * 0.05;
        const lobeRadius = r * 0.75;
        const lobeOffsetX = r * 0.55;
        const lobeOffsetY = r * 0.25;
        pdf.circle(cx - lobeOffsetX, cyh - lobeOffsetY, lobeRadius, 'F');
        pdf.circle(cx + lobeOffsetX, cyh - lobeOffsetY, lobeRadius, 'F');
        const baseY = cyh + r * 0.2;
        const baseHalfWidth = lobeRadius * 1.2;
        const pointDepth = r * 1.2;
        pdf.triangle(cx - baseHalfWidth, baseY, cx + baseHalfWidth, baseY, cx, cyh + pointDepth, 'F');
        break;
      }
      case '◆': {
        const w = r * 1.6; const h = r * 1.6;
        pdf.triangle(cx, cy - h, cx - w, cy, cx + w, cy, 'F');
        pdf.triangle(cx, cy + h, cx - w, cy, cx + w, cy, 'F');
        break;
      }
      case '★': {
        const points = 5; const outer = r * 1.4; const inner = outer * 0.5; const coords = [];
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outer : inner;
          const angle = (Math.PI / points) * i - Math.PI / 2;
          coords.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
        }
        coords.push(coords[0]);
        for (let i = 1; i < coords.length; i++) { pdf.line(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]); }
        pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        for (let i = 0; i < coords.length - 1; i++) { pdf.triangle(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1], cx, cy, 'F'); }
        break;
      }
      case '■': { const side = r * 2.2; pdf.rect(cx - side / 2, cy - side / 2, side, side, 'F'); break; }
      case '⬢': {
        const sides = 6; const radius = r * 1.35; const pts = [];
        for (let i = 0; i < sides; i++) { const ang = (Math.PI / 3) * i - Math.PI / 2; pts.push([cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius]); }
        pts.push(pts[0]);
        for (let i = 1; i < pts.length; i++) { pdf.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); }
        for (let i = 0; i < pts.length - 1; i++) { pdf.triangle(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], cx, cy, 'F'); }
        break;
      }
      default: pdf.setFont('helvetica', 'normal'); pdf.setFontSize(fontSize); pdf.setTextColor(rgb[0], rgb[1], rgb[2]); pdf.text(finalSymbol, x, y + fontSize * 0.35, { align: 'center' });
    }
  };

  const addNewPage = (bgRGB) => {
    pdf.addPage();
    pdf.setFillColor(bgRGB[0], bgRGB[1], bgRGB[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    currentY = 20;
  };

  // Page 1 background
  pdf.setFillColor(238, 245, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header
  const addHeader = async () => {
    const logoX = 15; const logoY = currentY + 15; const logoSize = 30; const logoRadius = 15;
    try {
      const resp = await fetch('/assets/image/villelogo.png');
      if (resp.ok) {
        const blob = await resp.blob();
        const dataUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
        pdf.setFillColor(255, 255, 255); pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F');
        pdf.setDrawColor(200, 200, 200); pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S');
        pdf.addImage(dataUrl, 'PNG', logoX + 2, logoY - logoRadius + 2, logoSize - 4, logoSize - 4);
      }
    } catch {}
    pdf.setTextColor(35, 44, 103); pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text("LEARNERS' VILLE", pageWidth / 2, logoY + 2, { align: 'center' });
    pdf.setFontSize(12); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0, 0, 0);
    pdf.text('6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines', pageWidth / 2, logoY + 10, { align: 'center' });
    pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
    pdf.text(`SY ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, pageWidth - 20, logoY + 2, { align: 'right' });
    pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.5); pdf.line(10, logoY + 20, pageWidth - 10, logoY + 20);
    currentY = logoY + 30;
  };

  await addHeader();

  // Learner Info card
  const startWhiteBox = (boxHeight = 60) => {
    const footerTopY = pageHeight - 30;
    if ((currentY - 5) + boxHeight > footerTopY) { addNewPage([238, 245, 255]); }
    const boxStartY = currentY - 5; const boxEndY = boxStartY + boxHeight;
    pdf.setFillColor(255, 255, 255); pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'F');
    pdf.setDrawColor(200, 200, 200); pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'S');
    return { boxStartY, boxEndY };
  };
  const endWhiteBox = (boxEndY) => { currentY = boxEndY + 8; };

  const learnerBox = startWhiteBox(80);
  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text("Learner's Information", 15, learnerBox.boxStartY + 15);
  const studentName = student ? `${student.stud_lastname || student.lastName || ''}, ${student.stud_firstname || student.firstName || ''} ${student.stud_middlename || student.middleName || ''}`.trim() : '____________________________';
  pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
  const leftX = 15; const rightX = 100; const startY = learnerBox.boxStartY + 30; const lineHeight = 10;
  pdf.setTextColor(100, 100, 100); pdf.text('Name:', leftX, startY);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); pdf.text(studentName, leftX + 15, startY);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Level:', leftX, startY + lineHeight);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold');
  const studentLevel = studentLevelData?.level_name || studentLevelData?.levelName || student?.level_name || student?.levelName || student?.level?.level_name || '________________________';
  pdf.text(studentLevel, leftX + 15, startY + lineHeight);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Lead Teacher:', leftX, startY + (lineHeight * 2));
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold');
  const leadTeacher = advisory?.lead_teacher_name ? formatName(advisory.lead_teacher_name) : '________________________';
  pdf.text(leadTeacher, leftX + 30, startY + (lineHeight * 2));
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Sex:', rightX, startY);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const studentGender = student?.stud_gender || student?.gender || '________________________'; pdf.text(studentGender, rightX + 10, startY);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Date of Birth:', rightX, startY + lineHeight);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const studentDOB = formatDateOfBirth(student?.dob || student?.stud_birthdate || student?.user_birthdate) || '________________________'; pdf.text(studentDOB, rightX + 28, startY + lineHeight);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Assistant Teacher:', rightX, startY + (lineHeight * 2));
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const assistantTeacher = advisory?.assistant_teacher_name ? formatName(advisory.assistant_teacher_name) : '________________________'; pdf.text(assistantTeacher, rightX + 40, startY + (lineHeight * 2));
  endWhiteBox(learnerBox.boxEndY);

  // Socio-demographic
  const socioBox = startWhiteBox(100);
  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Sociodemographic Profile', 15, socioBox.boxStartY + 15);
  pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Handedness:', 15, socioBox.boxStartY + 30);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const handedness = student?.handedness || student?.stud_handedness || '________________________'; pdf.text(handedness, 43, socioBox.boxStartY + 30);
  const parentStartY = socioBox.boxStartY + 45; const parentLeftX = 15; const parentRightX = 100; const parentLineHeight = 8;
  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.text("Father's Details", parentLeftX, parentStartY);
  pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Name:', parentLeftX, parentStartY + 15);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const fatherName = buildParentName(parentProfile, 'father') || '________________________'; pdf.text(fatherName, parentLeftX + 15, parentStartY + 15);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Age:', parentLeftX, parentStartY + 25);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const fatherAge = getParentAge(parentProfile, 'father') || '________________________'; pdf.text(fatherAge, parentLeftX + 15, parentStartY + 25);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Occupation:', parentLeftX, parentStartY + 35);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const fatherOccupation = getParentOccupation(parentProfile, 'father') || '________________________'; pdf.text(fatherOccupation, parentLeftX + 27, parentStartY + 35);
  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.text("Mother's Details", parentRightX, parentStartY);
  pdf.setFontSize(12); pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Name:', parentRightX, parentStartY + 15);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const motherName = buildParentName(parentProfile, 'mother') || '________________________'; pdf.text(motherName, parentRightX + 15, parentStartY + 15);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Age:', parentRightX, parentStartY + 25);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const motherAge = getParentAge(parentProfile, 'mother') || '________________________'; pdf.text(motherAge, parentRightX + 13, parentStartY + 25);
  pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'normal'); pdf.text('Occupation:', parentRightX, parentStartY + 35);
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'bold'); const motherOccupation = getParentOccupation(parentProfile, 'mother') || '________________________'; pdf.text(motherOccupation, parentRightX + 27, parentStartY + 35);
  endWhiteBox(socioBox.boxEndY);

  // Page 2: Attendance
  addNewPage([234, 247, 241]);
  currentY = 20;
  const attendanceBox = startWhiteBox(120);
  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Record of Attendance', 15, attendanceBox.boxStartY + 15);
  const getAttendanceSummary = () => {
    if (!attendanceData) return null;
    const months = [7,8,9,10,11,0,1,2,3];
    const monthLabels = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
    const summary = monthLabels.map((label, idx) => {
      const month = months[idx];
      const studentMonth = attendanceData.filter(a => new Date(a.attendance_date).getMonth() === month && a.student_id == student.student_id);
      const uniqueDates = [...new Set(studentMonth.map(a => a.attendance_date))];
      const dateStatuses = uniqueDates.map(date => {
        const recordsForDate = studentMonth.filter(a => a.attendance_date === date);
        const hasPresent = recordsForDate.some(a => a.attendance_status === 'Present');
        return hasPresent ? 'Present' : 'Absent';
      });
      return { label, total: uniqueDates.length, present: dateStatuses.filter(s => s==='Present').length, absent: dateStatuses.filter(s => s==='Absent').length };
    });
    const totalSchoolDays = summary.reduce((a,b)=>a+b.total,0);
    const totalPresent = summary.reduce((a,b)=>a+b.present,0);
    const totalAbsent = summary.reduce((a,b)=>a+b.absent,0);
    return { summary, totalSchoolDays, totalPresent, totalAbsent };
  };
  const att = getAttendanceSummary();
  const tableStartY = attendanceBox.boxStartY + 30; const tableWidth = pageWidth - 30; const categoryWidth = tableWidth * 0.30; const monthWidth = tableWidth * 0.07; const rowHeight = 14;
  const colPositions = [15]; colPositions.push(colPositions[0] + categoryWidth); for (let i = 1; i <= 10; i++) { colPositions.push(colPositions[i] + monthWidth); }
  pdf.setFillColor(235, 246, 249); pdf.rect(15, tableStartY, tableWidth, rowHeight, 'F'); pdf.setTextColor(0, 0, 0); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  const headers = ['Category','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','Total'];
  headers.forEach((header, colIdx) => { const x = colPositions[colIdx]; const width = colIdx === 0 ? categoryWidth : monthWidth; pdf.text(header, x + (width / 2), tableStartY + 6, { align: 'center' }); });
  // Header grid per cell
  pdf.setDrawColor(0,0,0); pdf.setLineWidth(0.5);
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const xLeft = colPositions[colIndex];
    const cellWidth = colIndex === 0 ? categoryWidth : monthWidth;
    pdf.rect(xLeft, tableStartY, cellWidth, rowHeight, 'S');
  }
  pdf.setTextColor(0, 0, 0); pdf.setFont('helvetica', 'normal');
  const attendanceRows = att ? [
    ['No. of\nSchool Days', ...att.summary.map(m=>String(m.total)), String(att.totalSchoolDays)],
    ['No. of Days\nPresent', ...att.summary.map(m=>String(m.present)), String(att.totalPresent)],
    ['No. of Days\nAbsent', ...att.summary.map(m=>String(m.absent)), String(att.totalAbsent)]
  ] : [
    ['No. of\nSchool Days', ...Array(10).fill('0')],
    ['No. of Days\nPresent', ...Array(10).fill('0')],
    ['No. of Days\nAbsent', ...Array(10).fill('0')]
  ];
  for (let rowIndex = 0; rowIndex < attendanceRows.length; rowIndex++) {
    const y = tableStartY + ((rowIndex + 1) * rowHeight);
    const row = attendanceRows[rowIndex];
    row.forEach((cell, colIndex) => {
      const x = colPositions[colIndex]; const width = colIndex === 0 ? categoryWidth : monthWidth;
      if (colIndex === 0) { const lines = String(cell).split('\n'); lines.forEach((line, li) => { pdf.text(line, x + 2, y + 6 + (li * 4)); }); }
      else { pdf.text(String(cell), x + (width / 2), y + 6, { align: 'center' }); }
    });
  }
  // Draw precise cell borders to avoid any missing lines on last row
  pdf.setDrawColor(0,0,0); pdf.setLineWidth(0.5);
  for (let rowIndex = 0; rowIndex < attendanceRows.length; rowIndex++) {
    const yTop = tableStartY + ((rowIndex + 1) * rowHeight);
    const yBottom = yTop + rowHeight;
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const xLeft = colPositions[colIndex];
      const cellWidth = colIndex === 0 ? categoryWidth : monthWidth;
      // Stroke rectangle per cell
      pdf.rect(xLeft, yTop, cellWidth, rowHeight, 'S');
    }
  }
  endWhiteBox(attendanceBox.boxEndY);

  // Parent signatures block (fixed height to reduce render time)
  const signatureBox = startWhiteBox(120);
  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Parent/Guardian Signatures', 15, signatureBox.boxStartY + 15);
  const quarterNames = quarters.filter(q => q.id <= 4).map(q => q.name);
  const availableHeight = signatureBox.boxEndY - (signatureBox.boxStartY + 40);
  const quarterSpacing = availableHeight / 4;
  const getQuarterCommentText = (quarterId) => {
    if (!Array.isArray(comments) || comments.length === 0) return '';
    const matches = comments.filter((c) => {
      const qid = Number(c.quarter_id ?? c.quarterId);
      if (!isNaN(qid)) return qid === Number(quarterId);
      if (c.quarter_name && typeof c.quarter_name === 'string') {
        const suffix = quarterId === 1 ? 'st' : quarterId === 2 ? 'nd' : quarterId === 3 ? 'rd' : 'th';
        return c.quarter_name.toLowerCase().startsWith(`${quarterId}${suffix} quarter`.toLowerCase());
      }
      return false;
    });
    if (matches.length === 0) return '';
    const getTime = (c) => { const t = c.updated_at || c.created_at || c.comment_date; const d = t ? new Date(t) : null; return d && !isNaN(d) ? d.getTime() : 0; };
    const latest = matches.sort((a, b) => getTime(a) - getTime(b))[matches.length - 1];
    const text = latest.comment_text || latest.feedback || latest.comment || '';
    return (typeof text === 'string' ? text.trim() : '') || '';
  };
  quarterNames.forEach((quarter, index) => {
    const startY = signatureBox.boxStartY + 35 + (index * quarterSpacing);
    pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.text(quarter, 15, startY);
    const qWidth = pdf.getTextWidth(quarter); const underlineStartX = 15 + qWidth + 5; const underlineEndX = underlineStartX + 100;
    pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.5); pdf.line(underlineStartX, startY + 2, underlineEndX, startY + 2);
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text('(Parent/Guardian Signature)', underlineEndX + 5, startY + 2);
    const commentY = startY + 10; pdf.setFontSize(12); pdf.setFont('helvetica', 'normal'); pdf.text('Teacher Comment:', 15, commentY);
    const actualComment = getQuarterCommentText(index + 1);
    if (actualComment && actualComment.trim()) { pdf.setFont('helvetica', 'bold'); pdf.text(actualComment, 60, commentY); }
    else { pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.5); pdf.line(60, commentY + 2, 120, commentY + 2); }
  });
  endWhiteBox(signatureBox.boxEndY);

  // Page 3: Quarterly Assessment
  addNewPage([255, 247, 230]);
  currentY = 20;
  const assessmentBox = startWhiteBox(140);
  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Quarterly Assessment', 15, assessmentBox.boxStartY + 15);
  if (subjects && subjects.length > 0) {
    const tableStartX = 15; const tableStartY2 = assessmentBox.boxStartY + 30; const tableWidth2 = pageWidth - 30; const subjectsColWidth = tableWidth2 * 0.35; const quarterColWidth = tableWidth2 * 0.13; const assessmentRowHeight = 12;
    pdf.setFillColor(235, 246, 249); pdf.rect(tableStartX, tableStartY2, tableWidth2, assessmentRowHeight, 'F'); pdf.setTextColor(0, 0, 0); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    const colPos = [tableStartX]; colPos.push(colPos[0] + subjectsColWidth); for (let i = 1; i <= 5; i++) { colPos.push(colPos[i] + quarterColWidth); }
    const headers2 = ['Subjects', '1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'Final'];
    headers2.forEach((header, colIndex) => { const x = colPos[colIndex]; const width = colIndex === 0 ? subjectsColWidth : quarterColWidth; pdf.text(header, x + (width / 2), tableStartY2 + 6, { align: 'center' }); });
    [...subjects].sort((a,b)=>a.localeCompare(b)).forEach((subject, i) => {
      const y = tableStartY2 + assessmentRowHeight + (i * assessmentRowHeight);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0, 0, 0); pdf.text(subject, tableStartX + 2, y + (assessmentRowHeight / 2) + 2);
      quarters.forEach((q, colIndex) => {
        const quarterId = colIndex + 1; const x = colPos[colIndex + 1]; let shape = '';
        if (quarterId === 5) {
          const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
          if (subjProgress && subjProgress.finalsubj_visual_feedback_id) { const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress.finalsubj_visual_feedback_id); shape = vf?.visual_feedback_shape || ''; }
        } else {
          const fb = quarterFeedback.find(f => f.subject_name === subject && Number(f.quarter_id) === quarterId);
          shape = fb?.shape || '';
        }
        if (shape) { renderSymbol(shape, x + quarterColWidth / 2, y + (assessmentRowHeight / 2), 10); }
      });
    });
    const quarterResultY = tableStartY2 + assessmentRowHeight + (subjects.length * assessmentRowHeight);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Quarter Result', tableStartX + 2, quarterResultY + (assessmentRowHeight / 2) + 2);
    quarters.forEach((q, colIndex) => {
      const quarterId = colIndex + 1; const x = colPos[colIndex + 1];
      let riskId = '';
      let shape = '';
      if (quarterId === 5) {
        // Final column - use overall progress
        riskId = overallProgress?.risk_id || '';
        if (overallProgress && overallProgress.visual_shape) {
          shape = overallProgress.visual_shape;
        }
      } else {
        // For quarters 1-4, get data from progress cards
        const card = progressCards.find(pc => Number(pc.quarter_id) === quarterId);
        riskId = card?.risk_id || '';
        if (card) {
          const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
          shape = vf?.visual_feedback_shape || '';
        }
      }

      // Render risk level circle (left) and assessment shape (right)
      const centerX = x + quarterColWidth / 2;
      const centerY = quarterResultY + (assessmentRowHeight / 2);
      if (riskId) {
        const riskColor = String(riskId) === '1' ? [34, 197, 94] : String(riskId) === '2' ? [251, 191, 36] : String(riskId) === '3' ? [239, 68, 68] : [156, 163, 175];
        const radius = 2; // Much smaller circle to match the image proportions
        pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
        pdf.circle(centerX - 8, centerY, radius, 'F');
      }
      if (shape) {
        renderSymbol(shape, centerX + 4, centerY, 10);
      }
    });
    pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.5);
    for (let row = 0; row <= subjects.length + 2; row++) { const y = tableStartY2 + (row * assessmentRowHeight); pdf.line(tableStartX, y, tableStartX + tableWidth2, y); }
    for (let col = 0; col <= headers2.length; col++) { const x = colPos[col]; pdf.line(x, tableStartY2, x, tableStartY2 + ((subjects.length + 2) * assessmentRowHeight)); }
  }
  endWhiteBox(assessmentBox.boxEndY);

  // Legend and Risk boxes
  const boxHeight = 100; const totalMargin = 30; const gapX = 10; const availableWidth = pageWidth - totalMargin - gapX; const boxWidth = availableWidth / 2; const marginX = 15; const legendStartY = currentY - 5; const legendBoxEndY = legendStartY + boxHeight;
  pdf.setFillColor(255, 255, 255); pdf.rect(marginX, legendStartY, boxWidth, boxHeight, 'F'); pdf.setDrawColor(200, 200, 200); pdf.rect(marginX, legendStartY, boxWidth, boxHeight, 'S');
  pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Assessment Legend', marginX + 5, legendStartY + 15);
  const innerPadLeft = 5; const legendTableWidth = boxWidth - 10; const shapesColWidth = legendTableWidth * 0.25; const descriptionColWidth = legendTableWidth * 0.50; const remarksColWidth = legendTableWidth * 0.25; const legendTableStartY = legendStartY + 25; const legendRowHeight = 12;
  const legendHeaders = ['Shapes','Descriptions','Remarks']; const legendColWidths = [shapesColWidth, descriptionColWidth, remarksColWidth];
  legendHeaders.forEach((header, index) => { let x = marginX + innerPadLeft; for (let i = 0; i < index; i++) { x += legendColWidths[i]; } const colWidth = legendColWidths[index]; pdf.setFillColor(235, 246, 249); pdf.rect(x, legendTableStartY, colWidth, legendRowHeight, 'F'); pdf.setDrawColor(0,0,0); pdf.rect(x, legendTableStartY, colWidth, legendRowHeight, 'S'); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 0, 0); pdf.text(header, x + (colWidth / 2), legendTableStartY + 8, { align: 'center' }); });
  const legendData = (visualFeedback && Array.isArray(visualFeedback) && visualFeedback.length) ? visualFeedback.map(feedback => [feedback.visual_feedback_shape || 'Unknown', feedback.visual_feedback_description || 'Unknown', feedback.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed']) : [['❤','Excellent','Passed'],['★','Very Good','Passed'],['◆','Good','Passed'],['▲','Need Help','Passed'],['⬤','Not Met','Failed']];
  legendData.forEach((row, index) => { const y = legendTableStartY + ((index + 1) * legendRowHeight); legendHeaders.forEach((_, colIndex) => { let x = marginX + innerPadLeft; for (let i = 0; i < colIndex; i++) { x += legendColWidths[i]; } const colWidth = legendColWidths[colIndex]; pdf.setFillColor(255,255,255); pdf.rect(x, y, colWidth, legendRowHeight, 'F'); pdf.setDrawColor(0,0,0); pdf.rect(x, y, colWidth, legendRowHeight, 'S'); }); let x = marginX + innerPadLeft; renderSymbol(row[0], x + (shapesColWidth / 2), y + 6, 10); x += shapesColWidth; pdf.setFont('helvetica', 'normal'); pdf.text(row[1], x + (descriptionColWidth / 2), y + 8, { align: 'center' }); x += descriptionColWidth; pdf.setFont('helvetica', 'bold'); pdf.text(row[2], x + (remarksColWidth / 2), y + 8, { align: 'center' }); });
  const riskBoxStartY = legendStartY; const riskBoxEndY = riskBoxStartY + boxHeight; const riskBoxX = marginX + boxWidth + gapX; pdf.setFillColor(255, 255, 255); pdf.rect(riskBoxX, riskBoxStartY, boxWidth, boxHeight, 'F'); pdf.setDrawColor(200, 200, 200); pdf.rect(riskBoxX, riskBoxStartY, boxWidth, boxHeight, 'S'); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Risk Levels', riskBoxX + 5, riskBoxStartY + 15);
  const riskTableWidth = boxWidth - 10; const levelColWidth = riskTableWidth * 0.40; const meaningColWidth = riskTableWidth * 0.60; const riskTableStartY = riskBoxStartY + 25; const riskRowHeight = 15; const riskHeaders = ['Level','Meaning']; const riskColWidths = [levelColWidth, meaningColWidth];
  riskHeaders.forEach((header, index) => { let x = riskBoxX + 5; for (let i = 0; i < index; i++) { x += riskColWidths[i]; } const colWidth = riskColWidths[index]; pdf.setFillColor(235, 246, 249); pdf.rect(x, riskTableStartY, colWidth, riskRowHeight, 'F'); pdf.setDrawColor(0, 0, 0); pdf.rect(x, riskTableStartY, colWidth, riskRowHeight, 'S'); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0,0,0); pdf.text(header, x + (colWidth / 2), riskTableStartY + 10, { align: 'center' }); });
  const riskData = [ { color: [34, 197, 94], label: 'Low', description: 'Meeting Expectations' }, { color: [251, 191, 36], label: 'Moderate', description: 'Needs Some Support' }, { color: [239, 68, 68], label: 'High', description: 'Needs Close Attention' } ];
  riskData.forEach((risk, index) => { const y = riskTableStartY + ((index + 1) * riskRowHeight); riskHeaders.forEach((_, colIndex) => { let x = riskBoxX + 5; for (let i = 0; i < colIndex; i++) { x += riskColWidths[i]; } const colWidth = riskColWidths[colIndex]; pdf.setFillColor(255, 255, 255); pdf.rect(x, y, colWidth, riskRowHeight, 'F'); pdf.setDrawColor(0, 0, 0); pdf.rect(x, y, colWidth, riskRowHeight, 'S'); }); let x = riskBoxX + 5; pdf.setFillColor(risk.color[0], risk.color[1], risk.color[2]); pdf.circle(x + 6, y + 6, 3.5, 'F'); pdf.setTextColor(0, 0, 0); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.text(risk.label, x + 12, y + 8); x += levelColWidth; pdf.setFont('helvetica', 'normal'); pdf.text(risk.description, x + (meaningColWidth / 2), y + 8, { align: 'center' }); });
  currentY = Math.max(legendBoxEndY, riskBoxEndY) + 15;

  // Page 4: Trend + Summary (optional if overallProgress exists)
  if (overallProgress && (overallProgress.visual_shape || overallProgress.risk_id)) {
    addNewPage([255, 238, 242]);
    currentY = 20;
    const trendBox = startWhiteBox(130);
    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.text('Quarterly Performance Trend', 15, trendBox.boxStartY + 15);
    // simple grid and labels
    const chartStartY = trendBox.boxStartY + 30; const chartHeight = 60; pdf.setDrawColor(220,220,220); pdf.setLineWidth(0.3);
    const gridLeft = 35; const gridRight = pageWidth - 15; const chartWidth = gridRight - gridLeft;
    for (let i = 0; i <= 4; i++) { const y = chartStartY + (i * (chartHeight / 4)); pdf.line(gridLeft, y, gridLeft + chartWidth, y); }
    const perfLevels = ['Excellent','Very Good','Good','Need Help','Not Met'];
    perfLevels.forEach((level, index) => { const y = chartStartY + (index * (chartHeight / 4)); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0, 0, 0); pdf.text(level, 15, y + 2.5); });
    const xLabelOrdinals = ['1st','2nd','3rd','4th']; pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); xLabelOrdinals.forEach((ord, i) => { const x = gridLeft + (i * (chartWidth / 3)); const bottomY = chartStartY + chartHeight + 8; const align = i === 0 ? 'left' : i === 3 ? 'right' : 'center'; pdf.text(ord, x, bottomY, { align }); pdf.text('Quarter', x, bottomY + 5, { align }); });
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.text('Performance Level', 15, chartStartY - 6); pdf.text('Quarter', gridLeft + chartWidth / 2, chartStartY + chartHeight + 18, { align: 'center' });
    const yMap = { 'Excellent': 0, 'Very Good': 1, 'Good': 2, 'Need Help': 3, 'Not Met': 4 };
    const xs = (idx) => gridLeft + (idx * (chartWidth / 3)); const ys = (val) => chartStartY + (val * (chartHeight / 4));
    const dataPoints = [1,2,3,4].map((qid) => { const card = Array.isArray(progressCards) ? progressCards.find(c => Number(c.quarter_id) === qid) : null; const desc = card ? visualFeedback.find(vf => vf.visual_feedback_id == card.quarter_visual_feedback_id)?.visual_feedback_description : null; return desc && yMap.hasOwnProperty(desc) ? yMap[desc] : null; });
    pdf.setDrawColor(96, 165, 250); pdf.setLineWidth(2); let prev = null; dataPoints.forEach((v, i) => { if (v === null) return; const x = xs(i); const y = ys(v); if (prev) { pdf.line(prev.x, prev.y, x, y); } prev = { x, y }; pdf.setFillColor(96, 165, 250); pdf.circle(x, y, 2.5, 'F'); });
    endWhiteBox(trendBox.boxEndY);

    const summaryParts = []; if (milestoneSummary && String(milestoneSummary).trim()) summaryParts.push(String(milestoneSummary).trim()); if (milestoneOverallSummary && String(milestoneOverallSummary).trim()) summaryParts.push(String(milestoneOverallSummary).trim());
    if (summaryParts.length === 0) { const presentVals = dataPoints.filter(v => v !== null); if (presentVals.length > 0) { const descMap = { 0: 'Excellent', 1: 'Very Good', 2: 'Good', 3: 'Need Help', 4: 'Not Met' }; const first = presentVals[0]; const last = presentVals[presentVals.length - 1]; if (last < first) { summaryParts.push(`In Quarter 1, started with ${descMap[first]?.toLowerCase() || 'moderate'} performance. In Quarter 2, showed improvement in performance. In Quarter 3, continued to show good progress. In Quarter 4, maintained ${descMap[last]?.toLowerCase() || 'consistent'} performance.`); } else if (last > first) { summaryParts.push(`In Quarter 1, started with ${descMap[first]?.toLowerCase() || 'strong'} performance. In Quarter 2, showed a decline in performance. In Quarter 3, continued to perform below expectations. In Quarter 4, continued to perform below expectations.`); } else { const consistentDesc = descMap[first]?.toLowerCase() || 'consistent'; summaryParts.push(`In Quarter 1, started with ${consistentDesc} performance. In Quarter 2, remained consistently ${consistentDesc}. In Quarter 3, remained consistently ${consistentDesc}. In Quarter 4, remained consistently ${consistentDesc}.`); } } }
    const combinedSummary = summaryParts.length ? summaryParts.join('\n\n') : 'No summary available.'; const summaryLines = pdf.splitTextToSize(combinedSummary, pageWidth - 30); const estimatedTextHeight = summaryLines.length * 5; const riskBarAllowance = 22; const basePadding = 40; const dynamicSummaryHeight = Math.min(110, Math.max(60, basePadding + estimatedTextHeight + riskBarAllowance)); const summaryBox = startWhiteBox(dynamicSummaryHeight);
    pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.text('Performance Summary', 15, summaryBox.boxStartY + 15);
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); const addText = (text, x, y, maxWidth = pageWidth - 30) => { const lines = pdf.splitTextToSize(text, maxWidth); pdf.text(lines, x, y); return y + (lines.length * 5); }; const afterSummaryY = addText(combinedSummary, 15, summaryBox.boxStartY + 30, pageWidth - 30);
    const finalRiskId = String(overallProgress?.risk_id || ''); let barColor = [96, 165, 250]; let riskLabel = 'No Data'; let riskDesc = 'Risk assessment data is not available.';
    if (finalRiskId === '1') { barColor = [34, 197, 94]; riskLabel = 'Low'; riskDesc = 'Student is performing well and meeting expectations.'; }
    else if (finalRiskId === '2') { barColor = [251, 191, 36]; riskLabel = 'Moderate'; riskDesc = 'Student may need additional support in some areas.'; }
    else if (finalRiskId === '3') { barColor = [239, 68, 68]; riskLabel = 'High'; riskDesc = 'Student requires immediate attention and intervention.'; }
    const infoBoxHeight = 26; const infoBoxY = Math.min(afterSummaryY + 8, summaryBox.boxStartY + dynamicSummaryHeight - infoBoxHeight - 6);
    pdf.setFillColor(255, 255, 255); pdf.rect(15, infoBoxY, pageWidth - 30, infoBoxHeight, 'F'); pdf.setDrawColor(220, 220, 220); pdf.rect(15, infoBoxY, pageWidth - 30, infoBoxHeight, 'S');
    const contentLeft = 15; const contentWidth = pageWidth - 30; const dotX = contentLeft + contentWidth * 0.10; const rowY = infoBoxY + 18; pdf.setFillColor(barColor[0], barColor[1], barColor[2]); pdf.circle(dotX, rowY - 2, 3, 'F'); pdf.setTextColor(0,0,0); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); const labelX = dotX + 8; pdf.text(riskLabel, labelX, rowY); const labelWidth = pdf.getTextWidth(riskLabel); const descX = labelX + labelWidth + 8; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(60,60,60); pdf.text(riskDesc, descX, rowY);
    endWhiteBox(summaryBox.boxEndY);
  }

  // Footer pages
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0, 0, 0);
    pdf.text(`Generated on ${new Date().toLocaleDateString()} | School Year ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
  }

  // Build consistent filename: Report_Card_{Last}_{First}_{Middle}_{YYYY-MM-DD}{HH-mm-ss-SSSZ}
  const last = (student?.stud_lastname || student?.lastName || '').toString().replace(/\s+/g, '');
  const first = (student?.stud_firstname || student?.firstName || '').toString().replace(/\s+/g, '');
  const middleRaw = (student?.stud_middlename || student?.middleName || '').toString().replace(/\s+/g, '');
  const parts = [last, first].filter(Boolean);
  if (middleRaw) parts.push(middleRaw);
  const namePart = (parts.length ? parts.join('_') : 'Student');
  const iso = new Date().toISOString(); // e.g., 2025-10-06T06:48:53.469Z
  const [dPart, tPart] = iso.split('T');
  const [hhmmss, msZ] = tPart.split('.'); // '06:48:53', '469Z'
  const timePart = `${hhmmss.replace(/:/g, '-')}-${msZ}`; // '06-48-53-469Z'
  const fileName = `Report_Card_${namePart}_${dPart}${timePart}.pdf`;
  pdf.save(fileName);
}

const SharedExport = ({ 
  student = {}, 
  parentProfile = {}, 
  studentLevelData = {}, 
  advisory = {}, 
  attendanceData = [], 
  subjects = [], 
  quarterFeedback = [], 
  progressCards = [], 
  finalSubjectProgress = [], 
  overallProgress = null, 
  visualFeedback = [], 
  comments = [],
  milestoneSummary = null,
  milestoneOverallSummary = null,
  quarters = [
    { id: 1, name: '1st Quarter' },
    { id: 2, name: '2nd Quarter' },
    { id: 3, name: '3rd Quarter' },
    { id: 4, name: '4th Quarter' },
    { id: 5, name: 'Final' },
  ]
}) => {
  // Helper to format date of birth
  function formatDateOfBirth(dateStr) {
    if (!dateStr) return <span className="italic text-gray-400">-</span>;
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper to format names as "Lastname, Firstname Middlename"
  function formatName(fullName) {
    if (!fullName) return "-";
    
    // Handle special cases that shouldn't be formatted as names
    const specialCases = ['Not assigned', 'Not Assigned', 'not assigned', 'N/A', 'n/a', 'None', 'none', 'TBD', 'tbd'];
    if (specialCases.includes(fullName.trim())) {
      return fullName.trim();
    }
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) return fullName;
    
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const middleName = nameParts.slice(1, -1).join(' ');
    
    if (middleName) {
      return `${lastName}, ${firstName} ${middleName}`;
    } else {
      return `${lastName}, ${firstName}`;
    }
  }

  // General helpers for printable data fallbacks
  function displayOrLine(value, line = '____________________________') {
    if (value === 0) return '0';
    if (value === false) return 'No';
    const str = typeof value === 'string' ? value.trim() : value;
    return str ? String(str) : line;
  }

  function computeAge(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const diff = Date.now() - d.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  function buildParentName(profile, prefix) {
    if (!profile) return '';
    const direct = profile[`${prefix}_name`] || profile[`${prefix}Name`];
    const first = profile[`${prefix}_firstname`] || profile[`${prefix}_first_name`] || profile[`${prefix}_first`] || profile[`${prefix}_fname`] || profile[`${prefix}FirstName`];
    const middle = profile[`${prefix}_middlename`] || profile[`${prefix}_middle_name`] || profile[`${prefix}_mname`] || profile[`${prefix}MiddleName`];
    const last = profile[`${prefix}_lastname`] || profile[`${prefix}_last_name`] || profile[`${prefix}_lname`] || profile[`${prefix}LastName`];
    if (direct && String(direct).trim()) return String(direct).trim();
    const parts = [first, middle, last].filter(Boolean).map(v => String(v).trim());
    return parts.join(' ');
  }

  function getParentAge(profile, prefix) {
    if (!profile) return '';
    const age = profile[`${prefix}_age`] || profile[`${prefix}Age`];
    if (age) return String(age);
    const bday = profile[`${prefix}_birthdate`] || profile[`${prefix}_dob`] || profile[`${prefix}Birthdate`];
    const computed = computeAge(bday);
    return Number.isFinite(computed) ? String(computed) : '';
  }

  function getParentOccupation(profile, prefix) {
    if (!profile) return '';
    return (
      profile[`${prefix}_occupation`] ||
      profile[`${prefix}Occupation`] ||
      ''
    );
  }

  // Helper to get latest teacher comment text for a given quarter (1-4)
  function getQuarterCommentText(quarterId) {
    if (!Array.isArray(comments) || comments.length === 0) return "";

    const matches = comments.filter((c) => {
      const qid = Number(c.quarter_id ?? c.quarterId);
      if (!isNaN(qid)) return qid === Number(quarterId);
      if (c.quarter_name && typeof c.quarter_name === 'string') {
        const suffix = quarterId === 1 ? 'st' : quarterId === 2 ? 'nd' : quarterId === 3 ? 'rd' : 'th';
        return c.quarter_name.toLowerCase().startsWith(`${quarterId}${suffix} quarter`.toLowerCase());
      }
      return false;
    });

    if (matches.length === 0) return "";

    const getTime = (c) => {
      const t = c.updated_at || c.created_at || c.comment_date;
      const d = t ? new Date(t) : null;
      return d && !isNaN(d) ? d.getTime() : 0;
    };

    const latest = matches.sort((a, b) => getTime(a) - getTime(b))[matches.length - 1];
    const text = latest.comment_text || latest.feedback || latest.comment || "";
    return (typeof text === 'string' ? text.trim() : '') || "";
  }

  // Helper to determine risk status color and text from risk_id
  const getRiskInfo = (riskId) => {
    if (!riskId) return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
    if (riskId === 1 || riskId === '1') return { text: 'Low', color: 'bg-green-500', textColor: 'text-green-700' };
    if (riskId === 2 || riskId === '2') return { text: 'Moderate', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    if (riskId === 3 || riskId === '3') return { text: 'High', color: 'bg-red-500', textColor: 'text-red-700' };
    return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
  };

  // Helper to process attendance data
  function getAttendanceSummary() {
    if (!attendanceData) return null;
    const months = [7,8,9,10,11,0,1,2,3]; // Aug-Apr
    const monthLabels = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const summary = monthLabels.map((label, idx) => {
      const month = months[idx];
      const studentMonth = attendanceData.filter(a => new Date(a.attendance_date).getMonth() === month && a.student_id == student.student_id);
      
      // Get unique dates for this month
      const uniqueDates = [...new Set(studentMonth.map(a => a.attendance_date))];
      
      // For each unique date, determine if student was present or absent
      const dateStatuses = uniqueDates.map(date => {
        const recordsForDate = studentMonth.filter(a => a.attendance_date === date);
        // If any record for this date shows "Present", count as present
        const hasPresent = recordsForDate.some(a => a.attendance_status === 'Present');
        return hasPresent ? 'Present' : 'Absent';
      });
      
      return {
        label,
        total: uniqueDates.length,
        present: dateStatuses.filter(status => status === 'Present').length,
        absent: dateStatuses.filter(status => status === 'Absent').length
      };
    });
    const totalSchoolDays = summary.reduce((a, b) => a + b.total, 0);
    const totalPresent = summary.reduce((a, b) => a + b.present, 0);
    const totalAbsent = summary.reduce((a, b) => a + b.absent, 0);
    return { summary, totalSchoolDays, totalPresent, totalAbsent };
  }

  // Add shapeColorMap for consistent coloring
  const shapeColorMap = {
    '♥': '#ef4444',      // Heart - red
    '★': '#f59e0b',      // Star - orange  
    '◆': '#1e40af',     // Diamond - dark blue
    '▲': '#10b981',      // Triangle - green
    '⬤': '#fef08a',      // Circle - light yellow
    '■': '#06b6d4',      // Square - light blue
    '⬢': '#def244'       // Hexagon - light green
  };

  // Helper to render status chart for print
  function renderPrintStatusChartSVG() {
    const yMap = { 'Excellent': 5, 'Very Good': 4, 'Good': 3, 'Need Help': 2, 'Not Met': 1 };
    const xLabels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
    const dataPoints = [1,2,3,4].map(qid => {
      const card = Array.isArray(progressCards) ? progressCards.find(c => Number(c.quarter_id) === qid) : null;
      const desc = card && Array.isArray(visualFeedback) ? visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id)?.visual_feedback_description : null;
      return yMap[desc] || null;
    });

    // Show placeholder when there's no data
    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white p-4">
          <div className="text-3xl mb-2">📊</div>
          <span className="text-base">No chart data available</span>
        </div>
      );
    }

    const width = 700; // px
    const height = 240; // px
    // Extra padding to keep line and points inside the inner chart rectangle
    const margin = { top: 20, right: 50, bottom: 42, left: 70 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;
    const innerPadX = 12;
    const innerPadY = 12;
    const plotLeft = margin.left + innerPadX;
    const plotRight = margin.left + chartW - innerPadX;
    const plotTop = margin.top + innerPadY;
    const plotBottom = margin.top + chartH - innerPadY;
    const xs = (i) => plotLeft + ((plotRight - plotLeft) / 3) * i; // 0..3
    const ys = (v) => plotBottom - ((v - 1) / 4) * (plotBottom - plotTop); // 1..5

    // Build path with gaps for nulls
    let path = '';
    dataPoints.forEach((v, i) => {
      if (v == null) return;
      const cmd = path ? 'L' : 'M';
      path += `${cmd}${xs(i)},${ys(v)} `;
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines and axes */}
          {[1,2,3,4,5].map((lvl) => (
            <g key={lvl}>
              <line x1={plotLeft} y1={ys(lvl)} x2={plotRight} y2={ys(lvl)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={plotLeft - 12} y={ys(lvl) + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                {['','Not Met','Need Help','Good','Very Good','Excellent'][lvl]}
              </text>
            </g>
          ))}
          <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke="#9ca3af" strokeWidth="1" />
          <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke="#9ca3af" strokeWidth="1" />

          {/* Line path */}
          <path d={path.trim()} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {/* Points */}
          {dataPoints.map((v, i) => v == null ? null : (
            <circle key={i} cx={xs(i)} cy={ys(v)} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
          ))}

          {/* X labels */}
          {xLabels.map((lbl, i) => {
            const isFirst = i === 0;
            const isLast = i === xLabels.length - 1;
            const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
            const xOffset = isFirst ? 4 : isLast ? -4 : 0;
            return (
              <text key={i} x={xs(i) + xOffset} y={plotBottom + 20} textAnchor={anchor} fontSize="13" fill="#6b7280">{lbl}</text>
            );
          })}
          <text x={(plotLeft + plotRight)/2} y={height - 6} textAnchor="middle" fontSize="12" fill="#374151">Quarter</text>
          <text x={16} y={margin.top - 6} textAnchor="start" fontSize="13" fill="#374151">Performance Level</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="hidden print:block" style={{margin: 0, padding: 0}}>
      {/* Page 1: School & Learner Info */}
      <div className="print-page p-10 pastel-blue border-soft rounded-xl text-[15px]" style={{margin: 0}}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-full bg-white/80 border border-white/70 p-2 flex items-center justify-center">
              <img src="/assets/image/villelogo.png" alt="School Logo" className="w-16 h-16 object-contain" />
            </div>
            <div>
              <div className="text-4xl font-extrabold tracking-tight text-[#232c67] leading-tight">LEARNERS' VILLE</div>
              <div className="text-lg text-gray-700">6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines</div>
            </div>
          </div>
          <div className="shrink-0">
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/80 border border-white/70 text-[#232c67] font-semibold text-base">
              SY {new Date().getFullYear()} - {new Date().getFullYear()+1}
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-white/70 rounded-full mb-8" />

        {/* Learner Information Card */}
        <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-7">
          <div className="section-title text-3xl font-bold text-gray-900 mb-5">Learner's Information</div>
          <div className="grid grid-cols-2 gap-5 text-lg leading-relaxed">
            <div>
              <div className="text-gray-600 font-semibold text-base">Name</div>
              <div className="text-gray-900 font-semibold text-lg">
                {student ? `${student.stud_lastname || student.lastName || ''}, ${student.stud_firstname || student.firstName || ''} ${student.stud_middlename || student.middleName || ''}` : '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-600 font-semibold text-base">Sex</div>
              <div className="text-gray-900 font-semibold text-lg">{student?.stud_gender || student?.gender || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600 font-semibold text-base">Level</div>
              <div className="text-gray-900 font-semibold text-lg">{displayOrLine(studentLevelData?.level_name || studentLevelData?.levelName || studentLevelData?.level?.level_name || student?.level_name || student?.levelName || student?.level?.level_name)}</div>
            </div>
            <div>
              <div className="text-gray-600 font-semibold text-base">Date of Birth</div>
              <div className="text-gray-900 font-semibold text-lg">{formatDateOfBirth(student?.dob || student?.stud_birthdate || student?.user_birthdate) || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600 font-semibold text-base">Lead Teacher</div>
              <div className="text-gray-900 font-semibold text-lg">
                {advisory?.lead_teacher_name ? formatName(advisory.lead_teacher_name) : 'Not assigned'}
              </div>
            </div>
            <div>
              <div className="text-gray-600 font-semibold text-base">Assistant Teacher</div>
              <div className="text-gray-900 font-semibold text-lg">
                {advisory?.assistant_teacher_name ? formatName(advisory.assistant_teacher_name) : 'Not assigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Socio-demographic Card */}
        <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7">
          <div className="section-title text-3xl font-bold text-gray-900 mb-5">Sociodemographic Profile</div>
          <div className="grid grid-cols-2 gap-6 text-lg leading-relaxed">
            <div>
              <div className="text-gray-600 font-semibold text-base">Handedness</div>
              <div className="text-gray-900 font-semibold text-lg">{displayOrLine(student?.handedness || student?.stud_handedness)}</div>
            </div>
            <div></div>
            <div className="space-y-2">
              <div className="text-gray-800 font-semibold text-xl">Father's Details</div>
              <div className="grid grid-cols-3 gap-4 text-gray-900">
                <div className="col-span-3"><span className="text-gray-600">Name</span>: <span className="font-semibold">{displayOrLine(buildParentName(parentProfile, 'father'))}</span></div>
                <div><span className="text-gray-600">Age</span>: <span className="font-semibold">{displayOrLine(getParentAge(parentProfile, 'father'))}</span></div>
                <div className="col-span-2"><span className="text-gray-600">Occupation</span>: <span className="font-semibold">{displayOrLine(getParentOccupation(parentProfile, 'father'))}</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-gray-800 font-semibold text-xl">Mother's Details</div>
              <div className="grid grid-cols-3 gap-4 text-gray-900">
                <div className="col-span-3"><span className="text-gray-600">Name</span>: <span className="font-semibold">{displayOrLine(buildParentName(parentProfile, 'mother'))}</span></div>
                <div><span className="text-gray-600">Age</span>: <span className="font-semibold">{displayOrLine(getParentAge(parentProfile, 'mother'))}</span></div>
                <div className="col-span-2"><span className="text-gray-600">Occupation</span>: <span className="font-semibold">{displayOrLine(getParentOccupation(parentProfile, 'mother'))}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Attendance + Parent Signatures */}
      <div className="print-page p-10 pastel-green border-soft rounded-xl text-[15px]" style={{margin: 0}}>
        {/* Attendance Card */}
        <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
          <div className="section-title text-3xl font-bold text-gray-900 mb-5">Record of Attendance</div>
          {(() => {
            const attendanceSummary = getAttendanceSummary();
            return attendanceSummary ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-lg no-break border-collapse table-fixed" style={{tableLayout: 'fixed'}}>
                  <colgroup>
                    <col style={{ width: '18%' }} />
                    {attendanceSummary.summary.map((_, idx) => (
                      <col key={idx} style={{ width: '8%' }} />
                    ))}
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr className="pastel-blue">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 border-soft">Category</th>
                      {attendanceSummary.summary.map((m, idx) => (
                        <th key={idx} className="px-2 py-3 text-center font-semibold text-gray-900 border-soft">{m.label}</th>
                      ))}
                      <th className="px-2 py-3 text-center font-semibold text-gray-900 border-soft whitespace-nowrap min-w-[64px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    <tr>
                      <td className="px-4 py-3 border-soft font-medium bg-white">No. of School Days</td>
                      {attendanceSummary.summary.map((m, idx) => (<td key={idx} className="px-2 py-3 text-center border-soft bg-white">{m.total}</td>))}
                      <td className="px-2 py-3 text-center border-soft font-semibold whitespace-nowrap bg-white">{attendanceSummary.totalSchoolDays}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-soft font-medium bg-white">No. of Days Present</td>
                      {attendanceSummary.summary.map((m, idx) => (<td key={idx} className="px-2 py-3 text-center border-soft bg-white">{m.present}</td>))}
                      <td className="px-2 py-3 text-center border-soft font-semibold whitespace-nowrap bg-white">{attendanceSummary.totalPresent}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-soft font-medium bg-white">No. of Days Absent</td>
                      {attendanceSummary.summary.map((m, idx) => (<td key={idx} className="px-2 py-3 text-center border-soft bg-white">{m.absent}</td>))}
                      <td className="px-2 py-3 text-center border-soft font-semibold whitespace-nowrap bg-white">{attendanceSummary.totalAbsent}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-600 italic">No attendance data available</div>
            );
          })()}
        </div>

        {/* Parent Signatures Card */}
        <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7">
          <div className="section-title text-3xl font-bold text-gray-900 mb-5">Parent/Guardian Signatures</div>
          <div className="grid grid-cols-1 gap-5 text-lg leading-relaxed">
            {[1, 2, 3, 4].map((q) => {
              const suffix = q===1?'st':q===2?'nd':q===3?'rd':'th';
              const quarterComment = getQuarterCommentText(q);
              return (
                <div key={q} className="no-break">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-[380px]">
                      <span className="font-semibold text-gray-800">{`${q}${suffix} Quarter`}</span>
                      <span className="h-px bg-gray-400 flex-1" style={{ minWidth: '240px' }}></span>
                    </div>
                    <div className="text-gray-600 text-base whitespace-nowrap">(Parent/Guardian Signature)</div>
                  </div>
                  <div className="mt-2 text-gray-800">
                    <span className="text-gray-600 font-semibold text-base">Teacher Comment:</span>{' '}
                    <span className="font-semibold">{quarterComment && quarterComment.length > 0 ? quarterComment : '____________________________'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page 3: Learning Progress & Assessment */}
      <div className="print-page p-10 pastel-yellow border-soft rounded-xl text-[15px]" style={{margin: 0}}>
        <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
          <div className="section-title text-3xl font-bold text-gray-900 mb-5">Quarterly Assessment</div>
          <div className="no-break">
            <table className="w-full text-lg border-soft">
              <thead>
                <tr className="bg-white">
                  <th className="px-4 py-2 text-left border-soft">Subjects</th>
                  {quarters.map(q => (
                    <th key={q.id} className="px-3 py-2 text-center border-soft">{q.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...subjects].sort((a,b)=>a.localeCompare(b)).map((subject, i)=> (
                  <tr key={i}>
                    <td className="px-4 py-1 border-soft font-medium text-gray-900">{subject}</td>
                    {quarters.map(q => {
                      if (q.id === 5) {
                        // Final column - show final subject progress
                        const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
                        const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress?.finalsubj_visual_feedback_id);
                        const shape = vf?.visual_feedback_shape || '';
                        return (
                          <td key={q.id} className="px-3 py-1 text-center border-soft bg-[#fffaf0]">
                            {shape ? (
                              <span style={{ color: shapeColorMap[shape] || 'inherit', fontSize: '1.5em' }}>{shape}</span>
                            ) : ''}
                          </td>
                        );
                      }
                      
                      // For quarters 1-4, show quarter feedback shapes directly
                      const fb = quarterFeedback.find(f => f.subject_name === subject && Number(f.quarter_id) === q.id);
                      const shape = fb?.shape || '';
                      return (
                        <td key={q.id} className="px-3 py-1 text-center border-soft bg-[#fffaf0]">
                          {shape ? (
                            <span style={{ color: shapeColorMap[shape] || 'inherit', fontSize: '1.5em' }}>{shape}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-white">
                  <td className="px-4 py-1 font-semibold border-soft">Quarter Result</td>
                  {quarters.map(q => {
                    let riskId = '';
                    if (q.id === 5) {
                      // Final column - use overall progress risk_id
                      riskId = overallProgress?.risk_id || '';
                    } else {
                      // For quarters 1-4, get risk_id from progress cards
                      const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                      riskId = card?.risk_id || '';
                    }
                    
                    // Show risk level circle and assessment shape
                    const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '#9ca3af';
                    let shape = '';
                    if (q.id === 5) {
                      // Final column - use overall progress
                      shape = overallProgress?.visual_shape || '';
                    } else {
                      // For quarters 1-4, get from progress cards
                      const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                      if (card) {
                        const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                        shape = vf?.visual_feedback_shape || '';
                      }
                    }
                    
                    return (
                      <td key={q.id} className="px-3 py-1 text-center border-soft">
                        {(riskId || shape) ? (
                          <div className="inline-flex items-center justify-center gap-2">
                            {riskId && (
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: riskColor }}></span>
                            )}
                            {shape && (
                              <span style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 'bold' }}>
                                {shape}
                              </span>
                            )}
                          </div>
                        ) : ''}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Left: Assessment Legend */}
          <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-5">
            <div className="section-title text-2xl font-bold text-gray-900 mb-4">Assessment Legend</div>
            <table className="w-full text-base border-soft">
              <thead>
                <tr className="bg-white">
                  <th className="text-left px-4 py-2 border-soft">Shapes</th>
                  <th className="text-left px-4 py-2 border-soft">Descriptions</th>
                  <th className="text-left px-4 py-2 border-soft">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(visualFeedback) && visualFeedback.length > 0
                  ? visualFeedback
                  : [
                      { visual_feedback_id: 1, visual_feedback_shape: '❤️', visual_feedback_description: 'Excellent' },
                      { visual_feedback_id: 2, visual_feedback_shape: '⭐', visual_feedback_description: 'Very Good' },
                      { visual_feedback_id: 3, visual_feedback_shape: '🔷', visual_feedback_description: 'Good' },
                      { visual_feedback_id: 4, visual_feedback_shape: '▲', visual_feedback_description: 'Need Help' },
                      { visual_feedback_id: 5, visual_feedback_shape: '●', visual_feedback_description: 'Not Met' }
                    ]
                ).map((item) => (
                  <tr key={item.visual_feedback_id} className="border-soft">
                    <td className="px-4 py-2 border-soft">
                      <span style={{ color: shapeColorMap[item.visual_feedback_shape] || 'inherit', fontSize: '1.5em' }}>
                        {item.visual_feedback_shape}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-soft">{item.visual_feedback_description}</td>
                    <td className="px-4 py-2 border-soft">{item.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: Risk Levels Table */}
          <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-5">
            <div className="section-title text-2xl font-bold text-gray-900 mb-4">Risk Levels</div>
            <table className="w-full text-base border-soft">
              <thead>
                <tr className="bg-white">
                  <th className="text-left px-4 py-2 border-soft">Level</th>
                  <th className="text-left px-4 py-2 border-soft">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { risk_id: 1 },
                  { risk_id: 2 },
                  { risk_id: 3 }
                ].map((risk, idx) => {
                  const info = getRiskInfo(risk.risk_id);
                  const color = String(risk.risk_id) === '1' ? '#10B981' : String(risk.risk_id) === '2' ? '#F59E0B' : '#EF4444';
                  const meaning = info.text === 'Low' ? 'Meeting Expectations' : info.text === 'Moderate' ? 'Needs Some Support' : info.text === 'High' ? 'Needs Close Attention' : '';
                  return (
                    <tr key={idx}>
                      <td className="px-4 py-2 border-soft">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                          <span className="font-medium">{info.text}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border-soft">{meaning}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Page 4: Performance Overview (refined UI) - Only show when there's overall progress */}
      {overallProgress && overallProgress.visual_shape && (
        <div className="print-page p-10 pastel-pink border-soft rounded-xl text-[15px]" style={{margin: 0}}>
          {/* Trend Card */}
          <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
            <div className="section-title text-3xl font-bold text-gray-900 mb-5">Quarterly Performance Trend</div>
            <div className="no-break">
              {renderPrintStatusChartSVG()}
            </div>
          </div>

          {/* Summary & Risk Side-by-side */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-6">
              <div className="section-title text-2xl font-bold text-gray-900 mb-4">Performance Summary</div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-base leading-relaxed">
                {(() => {
                  // Use milestone data if available, otherwise fallback to comments
                  let detailedSummary = milestoneSummary;
                  let overallAssessment = milestoneOverallSummary;
                  
                  // If no milestone data, try to find in comments
                  if (!detailedSummary && comments && comments.length > 0) {
                    const milestoneComment = comments.find(c => 
                      c.comment_text && (
                        c.comment_text.includes('milestone') || 
                        c.comment_text.includes('Quarter 1') || 
                        c.comment_text.includes('Overall, the learner')
                      )
                    );
                    if (milestoneComment) {
                      detailedSummary = milestoneComment.comment_text;
                    }
                  }
                  
                  // If still no detailed summary, try to construct from quarter comments
                  if (!detailedSummary && comments && comments.length > 0) {
                    const quarterComments = comments.filter(c => 
                      c.quarter_id && c.comment_text && c.comment_text.trim().length > 0
                    ).sort((a, b) => Number(a.quarter_id) - Number(b.quarter_id));
                    
                    if (quarterComments.length > 0) {
                      const quarterSummaries = quarterComments.map(c => {
                        const quarterName = c.quarter_name || `${c.quarter_id}${c.quarter_id === 1 ? 'st' : c.quarter_id === 2 ? 'nd' : c.quarter_id === 3 ? 'rd' : 'th'} Quarter`;
                        return `In ${quarterName}, ${c.comment_text}`;
                      });
                      detailedSummary = quarterSummaries.join(' ');
                    }
                  }
                  
                  // If no overall assessment from milestone, try to find in comments
                  if (!overallAssessment && comments && comments.length > 0) {
                    const overallComment = comments.find(c => 
                      c.comment_text && (
                        c.comment_text.includes('Overall, the learner') ||
                        c.comment_text.includes('High Risk') ||
                        c.comment_text.includes('Low Risk') ||
                        c.comment_text.includes('Moderate Risk')
                      )
                    );
                    if (overallComment) {
                      overallAssessment = overallComment.comment_text;
                    }
                  }
                  
                  return (
                    <div className="space-y-3">
                      {detailedSummary ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Summary</h4>
                          <p className="text-gray-800 leading-relaxed">{detailedSummary}</p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Summary</h4>
                          <p className="italic text-gray-600">No detailed summary available</p>
                        </div>
                      )}
                      
                      {overallAssessment ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Overall Assessment</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="font-semibold text-blue-900">{overallAssessment}</p>
                          </div>
                        </div>
                      ) : overallProgress && overallProgress.risk_id ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Overall Assessment</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="font-semibold text-blue-900">
                              Overall, the learner is classified as {
                                overallProgress.risk_id == 1 ? 'Low Risk' : 
                                overallProgress.risk_id == 2 ? 'Moderate Risk' : 
                                'High Risk'
                              }, indicating that learner needs {
                                overallProgress.risk_id == 1 ? 'minimal support' : 
                                overallProgress.risk_id == 2 ? 'some support' : 
                                'significant support'
                              }.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-6">
              <div className="section-title text-2xl font-bold text-gray-900 mb-4">Risk Level</div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-base">
                {(() => {
                  if (!overallProgress || typeof overallProgress !== 'object') {
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                          <span className="font-semibold">No Data</span>
                        </div>
                        <p className="text-gray-700">Risk assessment data is not available.</p>
                      </>
                    );
                  }
                  
                  const riskId = String(overallProgress?.risk_id || '');
                  let label = 'No Data';
                  let color = '';
                  let description = 'Risk assessment data is not available.';
                  if (riskId === '1') {
                    label = 'Low';
                    color = '#22c55e';
                    description = 'Student is performing well and meeting expectations.';
                  } else if (riskId === '2') {
                    label = 'Moderate';
                    color = '#fbbf24';
                    description = 'Student may need additional support in some areas.';
                  } else if (riskId === '3') {
                    label = 'High';
                    color = '#ef4444';
                    description = 'Student requires immediate attention and intervention.';
                  }
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                        <span className="font-semibold">{label}</span>
                      </div>
                      <p className="text-gray-700">{description}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedExport;
