"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaUser, FaSave, FaEdit, FaTrash, FaCheckCircle, FaRegClock, FaPlusCircle, FaExclamationTriangle, FaChartBar, FaTable, FaComments } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from 'next/navigation';

export default function StudentAssessment({ student, onBack, onRiskUpdate }) {
  const router = useRouter();
  
  // Redirect to login if not logged in
  useEffect(() => {
    const user_id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!user_id) {
      router.replace('/LoginSection');
    }
  }, [router]);

  // Helper to format date of birth
  function formatDateOfBirth(dateStr) {
    if (!dateStr) return <span className="italic text-gray-400">-</span>;
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper to capitalize the first letter regardless of leading spaces
  function capitalizeFirstLetter(str) {
    const trimmed = str.trimStart();
    if (!trimmed) return '';
    return trimmed[0].toUpperCase() + trimmed.slice(1);
  }

  // Helper to capitalize only the first non-space character, rest as entered
  function capitalizeFirstWord(str) {
    const trimmed = str.trimStart();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // Helper to auto-capitalize first non-space character as user types
  function autoCapitalizeInput(str) {
    const trimmed = str.trimStart();
    if (!trimmed) return str;
    return str.replace(/^(\s*)(\S)/, (match, p1, p2) => p1 + p2.toUpperCase());
  }

  // State management
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [visualFeedback, setVisualFeedback] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [quarterFeedback, setQuarterFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const quarters = [
    { id: 1, name: '1st Quarter' },
    { id: 2, name: '2nd Quarter' },
    { id: 3, name: '3rd Quarter' },
    { id: 4, name: '4th Quarter' },
    { id: 5, name: 'Final' },
  ];

  // Track which progress cards have been inserted to avoid duplicate calls
  const insertedProgressCards = useRef({});
  const [finalizedQuarters, setFinalizedQuarters] = useState({});
  const [finalizeLoading, setFinalizeLoading] = useState({}); // quarter_id: true/false
  const [progressCards, setProgressCards] = useState([]);
  const [quartersData, setQuartersData] = useState([]);
  const [currentQuarter, setCurrentQuarter] = useState(null);
  const [canComment, setCanComment] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [finalSubjectProgress, setFinalSubjectProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState(null);
  const [overallProgressLoading, setOverallProgressLoading] = useState(false);

  // Helper to get display name for sorting
  const getDisplayName = (key) => {
    if (key === "Socio") return "Socio Emotional";
    if (key === "Literacy") return "Literacy/English";
    if (key === "Math") return "Mathematical Skills";
    if (key === "Physical Activities") return "Physical Activities";
    return key;
  };

  // Fetch all data on component mount
  useEffect(() => {
    if (!student || !student.student_id || !student.advisory_id) return;
    
    setLoading(true);
    setError(null);
    
    const fetchAllData = async () => {
      try {
        const promises = [
          fetch("http://localhost/capstone-project/backend/Assessment/get_visual_feedback.php"),
          fetch("http://localhost/capstone-project/backend/Advisory/get_attendance.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ advisory_id: student.advisory_id })
          }),
          fetch(`http://localhost/capstone-project/backend/Assessment/get_subjects_by_advisory.php?advisory_id=${student.advisory_id}`),
          fetch(`http://localhost/capstone-project/backend/Assessment/get_student_quarter_feedback.php?student_id=${student.student_id}`),
          fetch(`http://localhost/capstone-project/backend/Assessment/get_student_progress_cards.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`),
          fetch('http://localhost/capstone-project/backend/Assessment/get_quarters.php'),
          fetch(`http://localhost/capstone-project/backend/Assessment/get_comments.php?student_id=${student.student_id}`),
          fetch(`http://localhost/capstone-project/backend/Assessment/get_subject_overall_progress.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`),
          fetch('http://localhost/capstone-project/backend/Assessment/get_overall_progress.php?student_id=' + student.student_id + '&advisory_id=' + student.advisory_id)
        ];

        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(res => res.json()));

        // Process visual feedback
        if (data[0].status === 'success') {
          setVisualFeedback(data[0].feedback);
        }

        // Process attendance data
        if (data[1].status === 'success') {
          setAttendanceData(data[1].attendance || []);
        }

        // Process subjects
        if (data[2].status === 'success' && Array.isArray(data[2].subjects)) {
          const subjectNames = data[2].subjects.map(subject => subject.subject_name);
          setSubjects(subjectNames);
          console.log('📚 Subjects loaded:', subjectNames);
        }

        // Process quarter feedback
        if (data[3].status === 'success') {
          setQuarterFeedback(data[3].feedback || []);
          console.log('📊 Quarter feedback loaded:', data[3].feedback || []);
          
          // Debug: Show feedback by quarter
          const feedbackByQuarter = {};
          (data[3].feedback || []).forEach(fb => {
            if (!feedbackByQuarter[fb.quarter_id]) feedbackByQuarter[fb.quarter_id] = [];
            feedbackByQuarter[fb.quarter_id].push(fb);
          });
          console.log('📊 Feedback by quarter:', feedbackByQuarter);
        }

        // Process progress cards
        if (data[4].status === 'success' && Array.isArray(data[4].cards)) {
          const status = {};
          data[4].cards.forEach(card => {
            status[card.quarter_id] = true;
          });
          setFinalizedQuarters(status);
          setProgressCards(data[4].cards);
        }

        // Process quarters data
        if (Array.isArray(data[5])) {
          setQuartersData(data[5]);
        }

        // Process comments
        if (data[6].status === 'success') {
          setComments(data[6].comments);
        }

        // Process subject overall progress
        if (data[7].status === 'success') {
          setFinalSubjectProgress(data[7].progress || []);
        }

        // Process overall progress
        if (data[8].status === 'success' && data[8].progress) {
          setOverallProgress(data[8].progress);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError('Failed to load assessment data. Please try again.');
        setLoading(false);
      }
    };

    fetchAllData();
  }, [student]);

  // Determine current quarter and comment eligibility
  useEffect(() => {
    if (!quartersData.length) return;
    const today = new Date();
    let foundQuarter = null;
    for (const q of quartersData) {
      const start = new Date(q.start_date);
      const end = new Date(q.end_date);
      if (today >= start && today <= end) {
        foundQuarter = q;
        break;
      }
    }
    setCurrentQuarter(foundQuarter);
    if (!foundQuarter) {
      setCanComment(false);
      const lastQuarter = quartersData[quartersData.length - 1];
      if (lastQuarter && today > new Date(lastQuarter.end_date)) {
        setCommentMessage('Commenting is not available at this time. You have commented on all 4 quarters.');
      } else {
        setCommentMessage('Commenting is not available at this time. Wait for the next quarter.');
      }
      return;
    }
    const alreadyCommented = comments.some(c => String(c.quarter_id) === String(foundQuarter.quarter_id) && String(c.commentor_id) === String(localStorage.getItem('userId')));
    if (alreadyCommented) {
      setCanComment(false);
      if (foundQuarter.quarter_id === 4) {
        setCommentMessage('Commenting is not available at this time. You have commented on all 4 quarters.');
      } else {
        setCommentMessage('Commenting is not available at this time. Wait for the next quarter.');
      }
    } else {
      setCanComment(true);
      setCommentMessage('');
    }
  }, [quartersData, comments]);

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

  // Helper to check if all subjects have feedback for a given quarter
  function allSubjectsHaveFeedbackForQuarter(qid) {
    if (subjects.length === 0) return false;
    
    // Debug: Log what we're checking
    console.log(`🔍 Checking quarter ${qid} for subjects:`, subjects);
    console.log(`🔍 Available feedback:`, quarterFeedback.filter(fb => Number(fb.quarter_id) === qid));
    
    // Check if each subject has feedback for this quarter
    const missingSubjects = subjects.filter(subject => {
      const hasFeedback = quarterFeedback.some(fb => 
        fb.subject_name === subject && Number(fb.quarter_id) === qid
      );
      if (!hasFeedback) {
        console.log(`❌ Subject "${subject}" missing feedback for quarter ${qid}`);
      }
      return !hasFeedback;
    });
    
    if (missingSubjects.length > 0) {
      console.log(`⚠️ Quarter ${qid} missing feedback for:`, missingSubjects);
    } else {
      console.log(`✅ Quarter ${qid} has feedback for all subjects`);
    }
    
    return missingSubjects.length === 0;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-medium text-gray-700">Loading assessment data...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest information</p>
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
      <div className="grid grid-cols-5 gap-8 bg-white px-8 pt-8 pb-8">
        {/* Left: Quarterly Assessment and Attendance (3 columns) */}
        <div className="col-span-3 space-y-8">
          {/* Quarterly Assessment Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaTable className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quarterly Assessment</h3>
                <p className="text-sm text-gray-600">Subject performance across quarters</p>
              </div>
            </div>
            
            {/* Assessment Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-3 bg-gray-50 text-left font-semibold text-gray-700">Subjects</th>
                    {quarters.map(q => {
                      let icon, color, cursor, tooltip, onClickHandler;
                      if (q.id === 5) {
                        // Debug: Log Final column logic
                        console.log('🔍 Final Column Logic Check:');
                        console.log('  - finalSubjectProgress:', finalSubjectProgress);
                        console.log('  - subjects.length:', subjects.length);
                        console.log('  - finalSubjectProgress.length:', finalSubjectProgress?.length || 0);
                        console.log('  - overallProgress:', overallProgress);
                        
                        if (overallProgress && overallProgress.visual_shape) {
                          icon = overallProgressLoading ? <span className="loader">⏳</span> : <FaCheckCircle />;
                          color = overallProgressLoading ? '#2563eb' : '#22c55e';
                          cursor = overallProgressLoading ? 'wait' : 'pointer';
                          tooltip = overallProgressLoading ? 'Updating...' : 'Update overall progress';
                          onClickHandler = overallProgressLoading ? undefined : async () => {
                            setOverallProgressLoading(true);
                            const user_id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                            try {
                              const res = await fetch('http://localhost/capstone-project/backend/Assessment/update_overall_progress.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ student_id: student.student_id, advisory_id: student.advisory_id, user_id })
                              });
                              const data = await res.json();
                              if (data.status === 'success') {
                                toast.success('Overall progress updated!');
                                setOverallProgress(data.progress);
                                if (onRiskUpdate) onRiskUpdate();
                              } else {
                                toast.error(data.message || 'Failed to update overall progress.');
                              }
                            } catch (err) {
                              toast.error('Network error. Please try again.');
                            }
                            setTimeout(() => setOverallProgressLoading(false), 3000);
                          };
                        } else if (finalSubjectProgress && finalSubjectProgress.length > 0 && finalSubjectProgress.length === subjects.length) {
                          console.log('✅ Final column has all subjects - Compute button should show');
                          icon = overallProgressLoading ? <span className="loader">⏳</span> : <FaPlusCircle />;
                          color = '#2563eb';
                          cursor = overallProgressLoading ? 'wait' : 'pointer';
                          tooltip = overallProgressLoading ? 'Computing...' : 'Compute Overall Progress';
                          onClickHandler = overallProgressLoading ? undefined : async () => {
                            setOverallProgressLoading(true);
                            try {
                              const user_id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                              const res = await fetch('http://localhost/capstone-project/backend/Assessment/insert_overall_progress.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ student_id: student.student_id, advisory_id: student.advisory_id, user_id: user_id })
                              });
                              const data = await res.json();
                              if (data.status === 'success') {
                                toast.success('Overall Progress computed!');
                                setOverallProgress(data);
                                if (onRiskUpdate) onRiskUpdate();
                              } else {
                                toast.error(data.message || 'Failed to compute overall progress.');
                              }
                            } catch (err) {
                              toast.error('Network error. Please try again.');
                            }
                            setOverallProgressLoading(false);
                          };
                        } else {
                          console.log('❌ Final column missing subjects - Compute button disabled');
                          console.log('  - Missing subjects count:', subjects.length - (finalSubjectProgress?.length || 0));
                          console.log('  - Subjects without final grades:', subjects.filter(subject => 
                            !finalSubjectProgress?.some(fp => fp.subject_name === subject)
                          ));
                          icon = <FaRegClock />;
                          color = '#d1d5db';
                          cursor = 'not-allowed';
                          tooltip = 'Complete all final subject grades to enable.';
                          onClickHandler = undefined;
                        }
                      } else {
                        const isFinalized = finalizedQuarters[q.id];
                        const allFeedback = allSubjectsHaveFeedbackForQuarter(q.id);
                        const isLoading = finalizeLoading[q.id];
                        const prevFinalized = q.id === 1 || Array.from({length: q.id-1}, (_, i) => i+1).every(prevQ => finalizedQuarters[prevQ]);
                        
                        if (!prevFinalized) {
                          icon = <FaRegClock />;
                          color = '#d1d5db';
                          cursor = 'not-allowed';
                          tooltip = 'Finalize previous quarters first.';
                          onClickHandler = undefined;
                        } else if (isLoading) {
                          icon = <span className="loader" style={{ fontSize: '1.2em' }}>⏳</span>;
                          color = '#2563eb';
                          cursor = 'wait';
                          tooltip = 'Finalizing...';
                          onClickHandler = undefined;
                        } else if (isFinalized) {
                          icon = <FaEdit />;
                          color = '#f59e0b';
                          cursor = 'pointer';
                          tooltip = `Update progress card for ${q.name}`;
                          onClickHandler = async () => {
                            setFinalizeLoading(prev => ({ ...prev, [q.id]: true }));
                            const user_id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                            if (!user_id) {
                              toast.error('User not logged in. Please log in again.');
                              setFinalizeLoading(prev => ({ ...prev, [q.id]: false }));
                              return;
                            }
                            
                            try {
                              const res = await fetch('http://localhost/capstone-project/backend/Assessment/update_progress_card.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  student_id: student.student_id,
                                  advisory_id: student.advisory_id,
                                  quarter_id: q.id,
                                  user_id: user_id
                                })
                              });
                              const data = await res.json();
                              
                              if (data.status === 'success') {
                                // Refresh data
                                const refreshRes = await fetch(`http://localhost/capstone-project/backend/Assessment/get_student_progress_cards.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`);
                                const refreshData = await refreshRes.json();
                                if (refreshData.status === 'success' && Array.isArray(refreshData.cards)) {
                                  const status = {};
                                  refreshData.cards.forEach(card => {
                                    status[card.quarter_id] = true;
                                  });
                                  setFinalizedQuarters(status);
                                  setProgressCards(refreshData.cards);
                                }
                                
                                if (q.id === 4) {
                                  // Check if subject overall progress already exists to decide between insert/update
                                  const checkRes = await fetch(`http://localhost/capstone-project/backend/Assessment/get_subject_overall_progress.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`);
                                  const checkData = await checkRes.json();
                                  
                                  let subjectRes;
                                  if (checkData.status === 'success' && checkData.progress && checkData.progress.length > 0) {
                                    // Records exist - use UPDATE
                                    subjectRes = await fetch('http://localhost/capstone-project/backend/Assessment/update_subject_overall_progress.php', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ student_id: student.student_id, advisory_id: student.advisory_id })
                                    });
                                  } else {
                                    // No records exist - use INSERT
                                    subjectRes = await fetch('http://localhost/capstone-project/backend/Assessment/insert_subject_overall_progress.php', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ student_id: student.student_id, advisory_id: student.advisory_id })
                                    });
                                  }
                                  
                                  const subjectData = await subjectRes.json();
                                  
                                  if (subjectData.status === 'success') {
                                    // Refresh the subject progress data
                                    const refreshSubjectRes = await fetch(`http://localhost/capstone-project/backend/Assessment/get_subject_overall_progress.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`);
                                    const refreshSubjectData = await refreshSubjectRes.json();
                                    if (refreshSubjectData.status === 'success') {
                                      setFinalSubjectProgress(refreshSubjectData.progress || []);
                                    }
                                    
                                    const action = checkData.status === 'success' && checkData.progress && checkData.progress.length > 0 ? 'Updated' : 'Computed';
                                    toast.success(`Progress Card Updated And Final Subject Grades ${action}`);
                                    if (onRiskUpdate) onRiskUpdate();
                                  } else if (subjectData.message && subjectData.message.includes('Not all 4 quarters have progress cards')) {
                                    toast.warning('Progress card updated but cannot compute final grades yet.');
                                  } else {
                                    toast.error('Progress card updated but failed to compute final grades: ' + (subjectData.message || 'Unknown error'));
                                  }
                                } else {
                                  toast.success('Progress card updated successfully.');
                                  if (onRiskUpdate) onRiskUpdate();
                                }
                              } else if (data.status === 'error' && data.missing_subjects) {
                                toast.success(data.message || 'Progress card updated successfully.');
                                if (onRiskUpdate) onRiskUpdate();
                              } else {
                                toast.error(data.message || 'Failed to update progress card.');
                              }
                            } catch (error) {
                              toast.error('Network error. Please try again.');
                            } finally {
                              setFinalizeLoading(prev => ({ ...prev, [q.id]: false }));
                            }
                          };
                        } else if (allFeedback) {
                          icon = <FaEdit />;
                          color = '#22c55e';
                          cursor = 'pointer';
                          tooltip = `Finalize ${q.name}`;
                          onClickHandler = async () => {
                            if (!isFinalized && allFeedback && !isLoading) {
                              setFinalizeLoading(prev => ({ ...prev, [q.id]: true }));
                              
                              const user_id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                              if (!user_id) {
                                toast.error('User not logged in. Please log in again.');
                                setFinalizeLoading(prev => ({ ...prev, [q.id]: false }));
                                return;
                              }
                                
                              try {
                                const res = await fetch('http://localhost/capstone-project/backend/Assessment/insert_progress_card.php', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    student_id: student.student_id,
                                    advisory_id: student.advisory_id,
                                    quarter_id: q.id,
                                    user_id: user_id
                                  })
                                });
                                
                                const data = await res.json();
                                
                                if (data.status === 'success' && data.students && data.students.length > 0) {
                                  // Refresh data
                                  const refreshRes = await fetch(`http://localhost/capstone-project/backend/Assessment/get_student_progress_cards.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`);
                                  const refreshData = await refreshRes.json();
                                  if (refreshData.status === 'success' && Array.isArray(refreshData.cards)) {
                                    const status = {};
                                    refreshData.cards.forEach(card => {
                                      status[card.quarter_id] = true;
                                    });
                                    setFinalizedQuarters(status);
                                    setProgressCards(refreshData.cards);
                                  }
                                  
                                  if (q.id === 4) {
                                    // Check if subject overall progress already exists to decide between insert/update
                                    const checkRes = await fetch(`http://localhost/capstone-project/backend/Assessment/get_subject_overall_progress.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`);
                                    const checkData = await checkRes.json();
                                    
                                    let subjectRes;
                                    if (checkData.status === 'success' && checkData.progress && checkData.progress.length > 0) {
                                      // Records exist - use UPDATE
                                      subjectRes = await fetch('http://localhost/capstone-project/backend/Assessment/update_subject_overall_progress.php', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ student_id: student.student_id, advisory_id: student.advisory_id })
                                      });
                                    } else {
                                      // No records exist - use INSERT
                                      subjectRes = await fetch('http://localhost/capstone-project/backend/Assessment/insert_subject_overall_progress.php', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ student_id: student.student_id, advisory_id: student.advisory_id })
                                      });
                                    }
                                    
                                    const subjectData = await subjectRes.json();
                                    
                                    if (subjectData.status === 'success') {
                                      // Refresh the subject progress data
                                      const refreshSubjectRes = await fetch(`http://localhost/capstone-project/backend/Assessment/get_subject_overall_progress.php?student_id=${student.student_id}&advisory_id=${student.advisory_id}`);
                                      const refreshSubjectData = await refreshSubjectRes.json();
                                      if (refreshSubjectData.status === 'success') {
                                        setFinalSubjectProgress(refreshSubjectData.progress || []);
                                      }
                                      
                                      const action = checkData.status === 'success' && checkData.progress && checkData.progress.length > 0 ? 'Updated' : 'Computed';
                                      toast.success(`4th quarter finalized and final subject grades ${action.toLowerCase()}`);
                                      if (onRiskUpdate) onRiskUpdate();
                                    } else if (subjectData.message && subjectData.message.includes('Not all 4 quarters have progress cards')) {
                                      toast.warning('4th quarter finalized but cannot compute final grades yet.');
                                    } else {
                                      toast.error('4th quarter finalized but failed to compute final grades: ' + (subjectData.message || 'Unknown error'));
                                    }
                                  } else {
                                    toast.success('Progress card generated successfully.');
                                    if (onRiskUpdate) onRiskUpdate();
                                  }
                                } else if (data.status === 'nochange') {
                                  toast.info(data.message || 'No changes made. Progress card already up to date.');
                                } else if (data.status === 'error' && data.missing_subjects) {
                                  toast.error(`Cannot finalize: Missing feedback for: ${data.missing_subjects.join(', ')}`);
                                } else {
                                  toast.error(data.message || 'Failed to generate progress card.');
                                }
                              } catch (error) {
                                toast.error('Network error. Please try again.');
                              } finally {
                                setFinalizeLoading(prev => ({ ...prev, [q.id]: false }));
                              }
                            }
                          };
                        } else {
                          icon = <FaRegClock />;
                          color = '#d1d5db';
                          cursor = 'not-allowed';
                          tooltip = 'Complete all feedback to finalize.';
                          onClickHandler = undefined;
                        }
                      }
                      return (
                        <th key={q.id} className="border-b border-gray-200 px-4 py-3 bg-gray-50 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span
                              title={tooltip}
                              style={{ cursor, fontSize: '1.5em', color, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
                              onClick={onClickHandler}
                              className="hover:scale-110 transition-transform"
                            >
                              {icon}
                            </span>
                            <span className="text-xs font-medium text-gray-600">{q.name}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {subjects.length > 0 ? (
                    [...subjects].sort((a, b) => a.localeCompare(b)).map((subject, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{subject}</td>
                        {quarters.map(q => {
                          const fb = quarterFeedback.find(f => f.subject_name === subject && Number(f.quarter_id) === q.id);
                          if (q.id === 5) {
                            const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
                            const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress?.finalsubj_visual_feedback_id);
                            return (
                              <td key={q.id} className="px-4 py-3 text-center">
                                {vf ? (
                                  <span 
                                    style={{ color: shapeColorMap[vf.visual_feedback_shape] || 'inherit', fontSize: '1.5em' }}
                                    className="inline-block hover:scale-110 transition-transform"
                                  >
                                    {vf.visual_feedback_shape}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          }
                          return (
                            <td key={q.id} className="px-4 py-3 text-center">
                              {fb ? (
                                <span 
                                  style={{ color: shapeColorMap[fb.shape] || 'inherit', fontSize: '1.5em' }}
                                  className="inline-block hover:scale-110 transition-transform"
                                >
                                  {fb.shape}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={quarters.length + 1} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FaTable className="text-4xl text-gray-300" />
                          <p className="text-gray-500 font-medium">No subjects found for this class</p>
                          <p className="text-sm text-gray-400">Subject data will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Quarter Result Row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-4 py-3 font-semibold text-blue-900">Quarter Result</td>
                    {quarters.map(q => {
                      if (q.id === 5) {
                        if (overallProgress && overallProgress.visual_shape) {
                          let riskColor = '';
                          if (overallProgress.risk_id == 1) riskColor = '#22c55e';
                          else if (overallProgress.risk_id == 2) riskColor = '#fbbf24';
                          else if (overallProgress.risk_id == 3) riskColor = '#ef4444';
                          return (
                            <td key={q.id} className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full shadow-sm"
                                  style={{ backgroundColor: riskColor || '#f1f5fd' }}
                                ></span>
                                <span 
                                  style={{ color: shapeColorMap[overallProgress.visual_shape] || '#222', fontSize: '1.5em', fontWeight: 'bold' }}
                                  className="inline-block hover:scale-110 transition-transform"
                                >
                                  {overallProgress.visual_shape}
                                </span>
                              </div>
                            </td>
                          );
                        } else {
                          return <td key={q.id} className="px-4 py-3 text-center text-gray-400">-</td>;
                        }
                      }
                      const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                      let shape = '';
                      let riskColor = '';
                      if (card) {
                        const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                        shape = vf ? vf.visual_feedback_shape : '';
                        if (card.risk_id == 1) riskColor = '#22c55e';
                        else if (card.risk_id == 2) riskColor = '#fbbf24';
                        else if (card.risk_id == 3) riskColor = '#ef4444';
                      }
                      return (
                        <td key={q.id} className="px-4 py-3 text-center">
                          {shape ? (
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full shadow-sm"
                                style={{ backgroundColor: riskColor || '#f1f5fd' }}
                              ></span>
                              <span 
                                style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 'bold' }}
                                className="inline-block hover:scale-110 transition-transform"
                              >
                                {shape}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-green-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Record of Attendance</h3>
                <p className="text-sm text-gray-600">Monthly attendance tracking</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border-b border-gray-200 px-2 py-3 text-left font-semibold text-gray-700 w-[120px]">Category</th>
                    {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((month) => (
                      <th key={month} className="border-b border-gray-200 px-1 py-3 text-center font-semibold text-gray-700">{month}</th>
                    ))}
                    <th className="border-b border-gray-200 px-2 py-3 text-center font-semibold text-gray-700 bg-blue-50">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const att = getAttendanceSummary();
                    if (!att) return (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <FaChartBar className="text-4xl text-gray-300" />
                            <p className="text-gray-500 font-medium">Loading attendance...</p>
                          </div>
                        </td>
                      </tr>
                    );
                    return [
                      <tr key="schooldays" className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 font-medium text-gray-900">No. of School Days</td>
                        {att.summary.map((m, idx) => <td key={idx} className="px-1 py-3 text-center text-gray-700">{m.total}</td>)}
                        <td className="px-2 py-3 text-center font-bold text-blue-600 bg-blue-50">{att.totalSchoolDays}</td>
                      </tr>,
                      <tr key="present" className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 font-medium text-gray-900">No. of Days Present</td>
                        {att.summary.map((m, idx) => <td key={idx} className="px-1 py-3 text-center text-green-600">{m.present}</td>)}
                        <td className="px-2 py-3 text-center font-bold text-green-600 bg-blue-50">{att.totalPresent}</td>
                      </tr>,
                      <tr key="absent" className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 font-medium text-gray-900">No. of Days Absent</td>
                        {att.summary.map((m, idx) => <td key={idx} className="px-1 py-3 text-center text-red-600">{m.absent}</td>)}
                        <td className="px-2 py-3 text-center font-bold text-red-600 bg-blue-50">{att.totalAbsent}</td>
                      </tr>
                    ];
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Right: Legend and Comments (2 columns) */}
        <div className="col-span-2 space-y-8">
          {/* Legend Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaTable className="text-purple-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assessment Legend</h3>
                <p className="text-sm text-gray-600">Performance indicators and meanings</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Shapes</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Descriptions</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {visualFeedback.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span 
                          style={{ color: shapeColorMap[item.visual_feedback_shape] || 'inherit', fontSize: '1.5em' }}
                          className="inline-block hover:scale-110 transition-transform"
                        >
                          {item.visual_feedback_shape}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">- {item.visual_feedback_description}</td>
                      <td className="px-4 py-3 text-gray-700">- {item.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Level Legend */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Risk Level</h3>
                <p className="text-sm text-gray-600">Performance risk indicators</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600 shadow-sm"></span>
                  <span className="text-sm font-medium text-gray-900">Low Risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-600 shadow-sm"></span>
                  <span className="text-sm font-medium text-gray-900">Moderate Risk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600 shadow-sm"></span>
                  <span className="text-sm font-medium text-gray-900">High Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaComments className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                <p className="text-sm text-gray-600">Quarterly feedback and notes</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {/* Comment Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <textarea
                    maxLength={100}
                    placeholder="Add a comment..."
                    className={`flex-1 border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none caret-[#232c67] ${
                      canComment ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    rows={3}
                    value={comment}
                    onChange={e => setComment(autoCapitalizeInput(e.target.value))}
                    disabled={!canComment}
                  />
                  <button
                    className={`p-3 rounded-lg transition-colors ${
                      canComment 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md' 
                        : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Save Comment"
                    onClick={async () => {
                      const trimmed = comment.trimStart();
                      if (trimmed) {
                        const commentor_id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                        if (!commentor_id || !student || !student.student_id) {
                          toast.error('Missing user or student info.');
                          return;
                        }
                        if (!canComment) return;
                        try {
                          const res = await fetch('http://localhost/capstone-project/backend/Assessment/create_comment.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ comment: comment, commentor_id: commentor_id, student_id: student.student_id })
                          });
                          const data = await res.json();
                          if (data.status === 'success') {
                            setComments([
                              {
                                comment_id: data.comment_id,
                                comment: capitalizeFirstLetter(comment),
                                commented_at: data.commented_at,
                                quarter_id: data.quarter_id,
                                quarter_name: data.quarter_name,
                                commentor_id: data.commentor_id,
                                commentor_name: data.commentor_name || (typeof window !== 'undefined' ? localStorage.getItem('full_name') : 'You'),
                                student_id: data.student_id
                              },
                              ...comments
                            ]);
                            setComment("");
                            toast.success('Comment added successfully!');
                          } else {
                            toast.error(data.message || 'Failed to add comment.');
                          }
                        } catch (err) {
                          toast.error('Network error. Please try again.');
                        }
                      }
                    }}
                    disabled={!canComment}
                  >
                    <FaSave className="text-sm" />
                  </button>
                </div>
                
                {commentMessage && (
                  <div className="text-xs text-gray-700 font-medium px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
                    {commentMessage}
                  </div>
                )}
              </div>

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Previous Comments</h4>
                  {comments.map((c, idx) => {
                    const isOwn = String(c.commentor_id) === String(typeof window !== 'undefined' ? localStorage.getItem('userId') : '');
                    const isEditing = editingCommentId === c.comment_id;
                    return (
                      <div key={c.comment_id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="text-sm text-gray-800 mb-2 leading-relaxed">
                          {isEditing ? (
                            <textarea
                              className="w-full border border-blue-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors caret-[#232c67]"
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              maxLength={100}
                              autoFocus
                              rows={3}
                              resize="none"
                            />
                          ) : (
                            c.comment
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-blue-600 font-medium mb-2">
                          <span>{c.commentor_name ? `— ${c.commentor_name}` : ''}</span>
                          {isOwn && !isEditing && (
                            <button
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Edit Comment"
                              onClick={() => {
                                setEditingCommentId(c.comment_id);
                                setEditingValue(c.comment);
                              }}
                            >
                              <FaEdit className="text-sm" />
                            </button>
                          )}
                          {isEditing && (
                            <div className="flex gap-2">
                              <button
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                onClick={async () => {
                                  const trimmed = editingValue.trim();
                                  if (!trimmed) return;
                                  try {
                                    const res = await fetch('http://localhost/capstone-project/backend/Assessment/update_comment.php', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ comment_id: c.comment_id, comment: trimmed })
                                    });
                                    const data = await res.json();
                                    if (data.status === 'success') {
                                      setComments(comments.map(com =>
                                        com.comment_id === c.comment_id
                                          ? { ...com, comment: trimmed, created_at: data.created_at, updated_at: data.updated_at }
                                          : com
                                      ));
                                      setEditingCommentId(null);
                                      setEditingValue("");
                                      toast.success('Comment updated!');
                                    } else {
                                      toast.error(data.message || 'Failed to update comment.');
                                    }
                                  } catch (err) {
                                    toast.error('Network error. Please try again.');
                                  }
                                }}
                              >
                                Save
                              </button>
                              <button
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingValue("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {c.quarter_name && (
                            <span className="font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {c.quarter_name}
                            </span>
                          )}
                          {c.created_at && (
                            <span>
                              {new Date(c.created_at).toLocaleString("en-US", { 
                                month: "short", 
                                day: "numeric", 
                                year: "numeric", 
                                hour: "numeric", 
                                minute: "2-digit", 
                                hour12: true 
                              })}
                            </span>
                          )}
                          {c.updated_at && c.updated_at !== c.created_at && (
                            <span className="italic text-gray-400">
                              (Edited {new Date(c.updated_at).toLocaleString("en-US", { 
                                month: "short", 
                                day: "numeric", 
                                year: "numeric", 
                                hour: "numeric", 
                                minute: "2-digit", 
                                hour12: true 
                              })})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}