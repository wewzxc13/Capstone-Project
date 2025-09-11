"use client";
import React from "react";

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
    '❤️': '#ef4444', // red
    '⭐': '#fbbf24', // yellow
    '🔷': '#2563eb', // blue
    '▲': '#f59e42', // orange
    '🟡': '#facc15'  // gold/yellow
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
                    if (q.id === 5) {
                      // Final column - show overall progress if available
                      const allQuartersFinalized = [1,2,3,4].every(quarterId => progressCards.some(pc => Number(pc.quarter_id) === quarterId));
                      const shape = overallProgress && overallProgress.visual_shape && allQuartersFinalized ? overallProgress.visual_shape : '';
                      const riskId = overallProgress?.risk_id;
                      const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '';
                      return (
                        <td key={q.id} className="px-3 py-1 text-center border-soft">
                          {shape ? (
                            <div className="inline-flex items-center gap-2">
                              {riskColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }}></span>}
                              <span style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 700 }}>{shape}</span>
                            </div>
                          ) : ''}
                        </td>
                      );
                    }
                    
                    // For quarters 1-4, show progress card shapes
                    const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                    if (card) {
                      const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                      const shape = vf?.visual_feedback_shape || '';
                      const riskId = card?.risk_id;
                      const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '';
                      return (
                        <td key={q.id} className="px-3 py-1 text-center border-soft">
                          {shape ? (
                            <div className="inline-flex items-center gap-2">
                              {riskColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }}></span>}
                              <span style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 700 }}>{shape}</span>
                            </div>
                          ) : ''}
                        </td>
                      );
                    }
                    return <td key={q.id} className="px-3 py-1 text-center border-soft"></td>;
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
