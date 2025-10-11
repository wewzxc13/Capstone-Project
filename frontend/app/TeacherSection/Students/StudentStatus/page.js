"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaUser, FaEdit, FaSave, FaTimes, FaChartLine, FaExclamationTriangle, FaCheckCircle, FaPrint } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import "../../../../lib/chart-config.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateAssessmentPDF } from '../DownloadPDF.js';
import { API } from '@/config/api';

export default function StudentStatus({ student, renderChart, onBack, triggerExport, onExportComplete, parentProfile, studentLevelData, advisory }) {
  // Handle export trigger from parent
  useEffect(() => {
    if (triggerExport) {
      handleExportAssessment();
      if (onExportComplete) {
        onExportComplete();
      }
    }
  }, [triggerExport]);

  // Helper to format date of birth
  function formatDateOfBirth(dateStr) {
    if (!dateStr) return <span className="italic text-gray-400">-</span>;
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <FaExclamationTriangle className="text-4xl mb-4 text-gray-300" />
        <p className="text-lg font-medium">No student data available</p>
        <p className="text-sm text-gray-500 mt-2">Please select a student to view their status</p>
      </div>
    );
  }

  const s = student;

  const [attendanceData, setAttendanceData] = useState(null);
  const [finalSubjectProgress, setFinalSubjectProgress] = useState([]);
  const [overallRisk, setOverallRisk] = useState({ risk: null });
  const [quarterlyPerformance, setQuarterlyPerformance] = useState([]);
  const [visualFeedbackMap, setVisualFeedbackMap] = useState({});
  const [milestoneSummary, setMilestoneSummary] = useState(null);
  const [milestoneOverallSummary, setMilestoneOverallSummary] = useState(null);
  const [milestoneRecordedAt, setMilestoneRecordedAt] = useState(null);
  const [milestoneId, setMilestoneId] = useState(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingOverallSummary, setEditingOverallSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [overallSummaryDraft, setOverallSummaryDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed print-based export path; using shared jsPDF instead
  
  // Additional state for SharedExport component
  const [subjects, setSubjects] = useState([]);
  const [quarterFeedback, setQuarterFeedback] = useState([]);
  const [progressCards, setProgressCards] = useState([]);
  const [overallProgress, setOverallProgress] = useState(null);
  const [visualFeedback, setVisualFeedback] = useState([]);
  const [comments, setComments] = useState([]);
  const [quarters] = useState([
    { id: 1, name: '1st Quarter' },
    { id: 2, name: '2nd Quarter' },
    { id: 3, name: '3rd Quarter' },
    { id: 4, name: '4th Quarter' },
    { id: 5, name: 'Final' },
  ]);

  useEffect(() => {
    if (!student || !student.student_id || !student.advisory_id) return;
    
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        const promises = [
          fetch(API.advisory.getAttendance(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ advisory_id: student.advisory_id })
          }),
          fetch(API.assessment.getSubjectOverallProgress(student.student_id, student.advisory_id)),
          fetch(API.assessment.getOverallProgress(student.student_id, student.advisory_id)),
          fetch(API.assessment.getVisualFeedback()),
          fetch(API.assessment.getStudentProgressCards(student.student_id, student.advisory_id)),
          fetch(API.assessment.getMilestoneInterpretation(student.student_id)),
          fetch(API.user.getUserProfile(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: student.parentId || student.parent_id }) }),
          fetch(API.user.getStudentDetails(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: student.student_id }) }),
          fetch(API.advisory.getAdvisoryDetails(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: student.student_id }) }),
          // Additional data for SharedExport
          fetch(API.assessment.getSubjectsByAdvisory(student.advisory_id)),
          fetch(API.assessment.getStudentQuarterFeedback(student.student_id)),
          fetch(API.assessment.getComments(student.student_id))
        ];

        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(res => res.json()));

        // Process attendance data
        if (data[0].status === 'success') {
          setAttendanceData(data[0].attendance || []);
        }

        // Process subject progress
        if (data[1].status === 'success') {
          setFinalSubjectProgress(data[1].progress || []);
        }

        // Process overall risk
        if (data[2].status === 'success' && data[2].progress && data[2].progress.risk_id) {
          setOverallRisk({ risk: data[2].progress.risk_id });
          setOverallProgress(data[2].progress);
        }

        // Process visual feedback
        if (data[3].status === 'success' && Array.isArray(data[3].feedback)) {
          const map = {};
          data[3].feedback.forEach(fb => {
            map[fb.visual_feedback_id] = fb.visual_feedback_description;
          });
          setVisualFeedbackMap(map);
          setVisualFeedback(data[3].feedback);
        }

        // Process progress cards
        if (data[4].status === 'success' && Array.isArray(data[4].cards)) {
          setQuarterlyPerformance(data[4].cards);
          setProgressCards(data[4].cards);
        }

        // Process milestone interpretation
        if (data[5].status === 'success' && data[5].milestone) {
          setMilestoneSummary(data[5].milestone.summary);
          setMilestoneOverallSummary(data[5].milestone.overall_summary);
          setMilestoneRecordedAt(data[5].milestone.recorded_at);
          setMilestoneId(data[5].milestone.milestone_id);
        }

        // Process additional data for SharedExport
        if (data[9].status === 'success' && Array.isArray(data[9].subjects)) {
          const subjectNames = data[9].subjects.map(subject => subject.subject_name);
          setSubjects(subjectNames);
        }

        if (data[10].status === 'success') {
          setQuarterFeedback(data[10].feedback || []);
        }

        if (data[11].status === 'success') {
          setComments(data[11].comments);
        }

        // Parent profile and student level data are now passed as props from parent component

        // Advisory details are now passed as props from parent component

        setLoading(false);
      } catch (err) {
        console.error('Error fetching student status data:', err);
        setError('Failed to load student data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [student]);

  // Helper to determine risk status color and text from risk_id
  const getRiskInfo = (riskId) => {
    if (!riskId) return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
    if (riskId === 1 || riskId === '1') return { text: 'Low', color: 'bg-green-500', textColor: 'text-green-700' };
    if (riskId === 2 || riskId === '2') return { text: 'Moderate', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    if (riskId === 3 || riskId === '3') return { text: 'High', color: 'bg-red-500', textColor: 'text-red-700' };
    return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
  };

  const { text: riskText, color: riskColor, textColor: riskTextColor } = getRiskInfo(overallRisk.risk);

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

  // Export using shared jsPDF generator (same content as Assessment)
  const handleExportAssessment = async () => {
    try {
      toast.info("Generating PDF...", { autoClose: 2000 });
      await generateAssessmentPDF({
        student,
        parentProfile,
        studentLevelData,
        advisory,
        attendanceData,
        subjects,
        quarterFeedback,
        progressCards,
        finalSubjectProgress,
        overallProgress,
        visualFeedback,
        comments,
        milestoneSummary,
        milestoneOverallSummary,
        quarters
      });
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error('Error exporting assessment:', err);
      toast.error("Failed to export. Please try again.");
    }
  };

  // Helper to process attendance data
  function getAttendanceSummary() {
    if (!attendanceData) return null;
    // Months Aug-Apr
    const months = [7,8,9,10,11,0,1,2,3]; // JS months: Aug=7, Sep=8, ..., Apr=3
    const monthLabels = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const summary = monthLabels.map((label, idx) => {
      const month = months[idx];
      // For selected student only
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
    // Totals
    const totalSchoolDays = summary.reduce((a, b) => a + b.total, 0);
    const totalPresent = summary.reduce((a, b) => a + b.present, 0);
    const totalAbsent = summary.reduce((a, b) => a + b.absent, 0);
    return { summary, totalSchoolDays, totalPresent, totalAbsent };
  }

  // Render line chart for quarterly performance
  function renderStatusChart() {
    // Y-axis: Excellent, Very Good, Good, Need Help, Not Met
    const yLabels = ["Excellent", "Very Good", "Good", "Need Help", "Not Met"];
    // CORRECT mapping based on visual_feedback_id:
    // visual_feedback_id = 1 → "Excellent" (score = 5)
    // visual_feedback_id = 2 → "Very Good" (score = 4)
    // visual_feedback_id = 3 → "Good" (score = 3)
    // visual_feedback_id = 4 → "Need Help" (score = 2)
    // visual_feedback_id = 5 → "Not Met" (score = 1)
    const yMap = { 'Excellent': 5, 'Very Good': 4, 'Good': 3, 'Need Help': 2, 'Not Met': 1 };
    const xLabels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
    // Map progress cards to y values
    const dataPoints = [1,2,3,4].map(qid => {
      const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
      const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
      return yMap[desc] || null;
    });
    
    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <FaChartLine className="text-4xl mb-4 text-gray-300" />
          <p className="text-lg font-medium">No chart data available</p>
          <p className="text-sm text-gray-500 mt-2">Quarterly performance data will appear here</p>
        </div>
      );
    }
    
    return (
      <div className="h-64 w-full bg-white rounded-lg border border-gray-200 p-4">
        <Line
          data={{
            labels: xLabels,
            datasets: [
              {
                label: "Performance",
                data: dataPoints,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: "#2563eb",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                spanGaps: true,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#2563eb',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                  label: function(context) {
                    const val = context.parsed.y;
                    const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                    return `Performance: ${labels[Math.round(val)] || 'N/A'}`;
                  }
                }
              }
            },
            scales: {
              y: {
                min: 0.5,
                max: 5.5,
                ticks: {
                  stepSize: 1,
                  callback: function(value) {
                    const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                    return labels[Math.round(value)] || '';
                  },
                  font: { size: 12, weight: '500' },
                  color: '#6b7280',
                },
                grid: { 
                  color: '#e5e7eb',
                  drawBorder: false,
                },
                title: {
                  display: true,
                  text: 'Performance Level',
                  font: { size: 14, weight: '600' },
                  color: '#374151',
                  padding: { top: 10, bottom: 10 }
                }
              },
              x: {
                ticks: { 
                  font: { size: 12, weight: '500' },
                  color: '#6b7280',
                },
                grid: { 
                  color: '#e5e7eb',
                  drawBorder: false,
                },
                title: {
                  display: true,
                  text: 'Quarter',
                  font: { size: 14, weight: '600' },
                  color: '#374151',
                  padding: { top: 10, bottom: 10 }
                }
              },
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          }}
        />
      </div>
    );
  }

  // Helper to get display name for sorting
  const getDisplayName = (key) => {
    if (key === "Socio") return "Socio Emotional";
    if (key === "Literacy") return "Literacy/English";
    if (key === "Math") return "Mathematical Skills";
    if (key === "Physical Activities") return "Physical Activities";
    return key;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-medium text-gray-700">Loading student status...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">Error Loading Data</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-6 bg-white px-1.5 sm:px-6 pt-3 pb-4">
        {/* Left: Progress Circles (2 columns) */}
        <div className="col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Final Subject Averages Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3 sm:mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Final Subject Averages</h3>
                <p className="text-sm text-gray-600">Overall performance across all subjects</p>
              </div>
            </div>
            
            {(s.scores && Object.entries(s.scores).length > 0) || finalSubjectProgress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(s.scores && Object.entries(s.scores).length > 0
                  ? Object.entries(s.scores)
                      .sort((a, b) => getDisplayName(a[0]).localeCompare(getDisplayName(b[0])))
                      .map(([key, val], idx) => {
                      // Unique color palette for up to 8 subjects
                      const uniqueColors = [
                        { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }, // yellow
                        { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }, // red
                        { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // blue
                        { bg: '#e9d5ff', border: '#8b5cf6', text: '#5b21b6' }, // purple
                        { bg: '#d1fae5', border: '#10b981', text: '#065f46' }, // green
                        { bg: '#fce7f3', border: '#ec4899', text: '#be185d' }, // pink
                        { bg: '#dbeafe', border: '#60a5fa', text: '#1d4ed8' }, // light blue
                        { bg: '#fed7aa', border: '#f97316', text: '#c2410c' }  // orange
                      ];
                      const color = uniqueColors[idx % uniqueColors.length];
                      return (
                        <div key={key} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="relative w-16 h-16">
                            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                                fill="none"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke={color.border}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${(2 * Math.PI * 20 * val) / 100} ${2 * Math.PI * 20}`}
                                strokeLinecap="round"
                                transform="rotate(-90 24 24)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-900">{val}%</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {key === "Socio"
                                ? "Socio Emotional"
                                : key === "Literacy"
                                ? "Literacy/English"
                                : key === "Math"
                                ? "Mathematical Skills"
                                : "Physical Activities"}
                            </span>
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${val}%`, 
                                    backgroundColor: color.border 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : [...finalSubjectProgress].sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || '')).map((row, idx) => {
                      const percent = Math.round(Number(row.finalsubj_avg_score));
                      const uniqueColors = [
                        { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }, // yellow
                        { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }, // red
                        { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // blue
                        { bg: '#e9d5ff', border: '#8b5cf6', text: '#5b21b6' }, // purple
                        { bg: '#d1fae5', border: '#10b981', text: '#065f46' }, // green
                        { bg: '#fce7f3', border: '#ec4899', text: '#be185d' }, // pink
                        { bg: '#dbeafe', border: '#60a5fa', text: '#1d4ed8' }, // light blue
                        { bg: '#fed7aa', border: '#f97316', text: '#c2410c' }  // orange
                      ];
                      const color = uniqueColors[idx % uniqueColors.length];
                      return (
                        <div key={row.subject_id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="relative w-16 h-16">
                            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                                fill="none"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke={color.border}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${(2 * Math.PI * 20 * percent) / 100} ${2 * Math.PI * 20}`}
                                strokeLinecap="round"
                                transform="rotate(-90 24 24)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-900">{percent}%</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900">{row.subject_name}</span>
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${percent}%`, 
                                    backgroundColor: color.border 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaChartLine className="text-gray-400 text-xl" />
                </div>
                <p className="text-gray-500 font-medium">No scores available</p>
                <p className="text-sm text-gray-400 mt-1">Subject averages will appear here</p>
              </div>
            )}
          </div>

          {/* Risk Status Section */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-3 sm:p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Final Risk Status</h3>
                <p className="text-sm text-gray-600">Overall assessment of student progress</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${riskColor} shadow-sm`}></div>
                <span className={`font-semibold ${riskTextColor}`}>
                  {riskText === 'No Data'
                    ? <span className="italic text-gray-400">{riskText}</span>
                    : riskText
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {riskText === 'Low' && 'Student is performing well and meeting expectations.'}
                {riskText === 'Moderate' && 'Student may need additional support in some areas.'}
                {riskText === 'High' && 'Student requires immediate attention and intervention.'}
                {riskText === 'No Data' && 'Risk assessment data is not available.'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Right: Chart and Summary (3 columns) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col h-full space-y-4 sm:space-y-6">
          {/* Chart Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3 sm:mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quarterly Performance Trend</h3>
                <p className="text-sm text-gray-600">Performance progression across quarters</p>
              </div>
            </div>
            
            {renderStatusChart()}
          </div>

          {/* Summary Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-6 border border-green-100">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
                  <p className="text-sm text-gray-600">Detailed analysis and recommendations</p>
                </div>
              </div>
              
              {milestoneSummary || milestoneOverallSummary ? (
                <button
                  onClick={() => {
                    setEditingSummary(true);
                    setSummaryDraft(milestoneSummary || "");
                    setOverallSummaryDraft(milestoneOverallSummary || "");
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FaEdit className="text-sm" />
                  Edit Summary
                </button>
              ) : null}
            </div>

            {quarterlyPerformance.length > 0 ? (
              /* Editable summary */
              editingSummary ? (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Summary</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={summaryDraft}
                        onChange={e => setSummaryDraft(e.target.value)}
                        rows={4}
                        placeholder="Enter detailed performance summary..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Overall Assessment</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm font-semibold bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={overallSummaryDraft}
                        onChange={e => setOverallSummaryDraft(e.target.value)}
                        rows={2}
                        placeholder="Enter overall assessment..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        onClick={() => setEditingSummary(false)}
                      >
                        <FaTimes className="text-sm" />
                        Cancel
                      </button>
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        onClick={async () => {
                          if (!milestoneId) return;
                          try {
                            const res = await fetch(API.assessment.updateMilestoneInterpretation(), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                milestone_id: milestoneId,
                                summary: summaryDraft,
                                overall_summary: overallSummaryDraft
                              })
                            });
                            const data = await res.json();
                            if (data.status === 'success') {
                              toast.success('Summary updated successfully!');
                              setMilestoneSummary(summaryDraft);
                              setMilestoneOverallSummary(overallSummaryDraft);
                              setMilestoneRecordedAt(new Date().toISOString());
                              setEditingSummary(false);
                            } else {
                              toast.error(data.message || 'Failed to update summary.');
                            }
                          } catch (err) {
                            toast.error('Network error. Please try again.');
                          }
                        }}
                      >
                        <FaSave className="text-sm" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  {milestoneSummary || milestoneOverallSummary ? (
                    <div className="space-y-4">
                      {milestoneSummary && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Summary</h4>
                          <p className="text-gray-800 leading-relaxed">{milestoneSummary}</p>
                        </div>
                      )}
                      {milestoneOverallSummary && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Overall Assessment</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="font-semibold text-blue-900">{milestoneOverallSummary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-gray-400 text-xl" />
                      </div>
                      <p className="text-gray-500 font-medium">No summary available</p>
                      <p className="text-sm text-gray-400 mt-1">Performance summary will be auto-generated when student completes their progress</p>
                    </div>
                  )}
                  
                  {milestoneRecordedAt && (milestoneSummary || milestoneOverallSummary) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 text-right">
                        Last Updated: {new Date(milestoneRecordedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="text-gray-400 text-xl" />
                  </div>
                  <p className="text-gray-500 font-medium">No Assessment Data</p>
                  <p className="text-sm text-gray-400 mt-1">Performance summary requires quarterly assessment grades to be available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Removed print-based SharedExport; using jsPDF generator for download */}
    </div>
  );
}
