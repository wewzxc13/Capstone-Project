"use client";

import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import '../../../lib/chart-config.js';
import { FaBell, FaCog, FaChevronDown, FaEdit, FaMale, FaFemale, FaUsers, FaMars, FaVenus } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

export default function SuperAdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState("Attendance Report");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside of dropdown containers
      const isOutsideDropdowns = !event.target.closest('.dropdown-container');
      if (isOutsideDropdowns) {
        closeAllDropdowns();
      }
    };

    // Add event listener if any dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const chartData = {
    labels:
      selectedReport === "Subject Report"
        ? (subjectData && subjectData.subjectNames) 
          ? subjectData.subjectNames 
          : ["Subject 1", "Subject 2", "Subject 3", "Subject 4"]
        : selectedReport === "Progress Report"
        ? (progressData && progressData.quarterNames) 
          ? progressData.quarterNames 
          : ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"]
        : (attendanceData && attendanceData.quarterNames) 
          ? attendanceData.quarterNames 
        : ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
         datasets: (() => {
               if (selectedReport === "Attendance Report" && attendanceData) {
          const colors = ["#60a5fa", "#facc15", "#f87171"];
          
          // If no level names or no attendance data, show empty chart
          if (!attendanceData.levelNames || attendanceData.levelNames.length === 0 || !attendanceData.hasData) {
            return [{
              label: "No Data",
              data: [0, 0, 0, 0],
              backgroundColor: "#e5e7eb",
            }];
          }
          
          return attendanceData.levelNames.map((levelName, index) => ({
            label: levelName,
            data: attendanceData.quarterData[levelName] || [0, 0, 0, 0],
            backgroundColor: colors[index] || "#60a5fa",
          }));
                 } else if (selectedReport === "Subject Report") {
           // Subject Report - show subject performance data
           if (subjectData && subjectData.hasSubjectData && subjectData.subjectNames) {
             const colors = ["#5C9EFF", "#FDCB44", "#FF7B7B"]; // Blue, Yellow, Red (same as Progress Report)
             
             return subjectData.levelNames.map((levelName, index) => ({
               label: levelName,
               data: subjectData.subjectNames.map(subjectName => 
                 subjectData.subjectData[levelName]?.[subjectName] || 0
               ),
               backgroundColor: colors[index] || "#5C9EFF",
             }));
           } else {
             return [{
               label: "No Data",
               data: [0, 0, 0, 0],
               backgroundColor: "#e5e7eb",
             }];
           }
                  } else {
           // Progress Report - show quarterly performance data as bar chart
           if (progressData && progressData.hasData && progressData.levelNames) {
             const colors = ["#5C9EFF", "#FDCB44", "#FF7B7B"]; // Blue, Yellow, Red (same as dashboard)
             
             return progressData.levelNames.map((levelName, index) => ({
               label: levelName,
               data: progressData.quarterData[levelName] || [0, 0, 0, 0],
               backgroundColor: colors[index] || "#5C9EFF",
             }));
           } else {
             return [{
               label: "No Data",
               data: [0, 0, 0, 0],
               backgroundColor: "#e5e7eb",
             }];
           }
         }
    })(),
  };

     const chartOptions = {
     responsive: true,
     maintainAspectRatio: false,
     plugins: {
       legend: {
         position: 'top',
         labels: {
           padding: 10,
           font: {
             size: 12
           }
         }
       }
     },
     scales: {
       y: {
         beginAtZero: true,
         max: (selectedReport === "Progress Report" || selectedReport === "Subject Report") ? 100 : 100,
         min: (selectedReport === "Progress Report" || selectedReport === "Subject Report") ? 0 : 0,
         ticks: {
           font: {
             size: 11
           },
           padding: 5,
           ...((selectedReport === "Progress Report" || selectedReport === "Subject Report" || selectedReport === "Attendance Report") && {
             stepSize: 20,
             callback: function(value) {
               return value + '%';
             }
           })
         },
         grid: {
           drawBorder: false
         },
         ...((selectedReport === "Progress Report" || selectedReport === "Subject Report") && {
           title: {
             display: true,
             text: 'Performance Percentage',
             font: { size: 12, weight: 'bold' },
             color: '#1f2937'
           }
         }),
         ...(selectedReport === "Attendance Report" && {
           title: {
             display: true,
             text: 'Attendance Percentage',
             font: { size: 12, weight: 'bold' },
             color: '#1f2937'
           }
         })
       },
                x: {
           ticks: {
             font: {
               size: 11
             },
             padding: 5
           },
           grid: {
             display: false
           },
           ...(selectedReport === "Progress Report" && {
             title: {
               display: true,
               text: 'Quarter',
               font: { size: 12, weight: 'bold' },
               color: '#1f2937'
             }
           }),
           ...(selectedReport === "Subject Report" && {
             title: {
               display: true,
               text: 'Subject',
               font: { size: 12, weight: 'bold' },
               color: '#1f2937'
             }
           }),
           ...(selectedReport === "Attendance Report" && {
             title: {
               display: true,
               text: 'Quarter',
               font: { size: 12, weight: 'bold' },
               color: '#1f2937'
             }
           })
         }
     },
     layout: {
       padding: {
         top: 10,
         bottom: 10,
         left: 10,
         right: 10
       }
     }
   };

  const reports = ["Attendance Report", "Progress Report", "Subject Report"];

  // Fetch attendance data from API
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost/capstone-project/backend/Advisory/get_attendance_report_data.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setAttendanceData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

     // Fetch progress data from API
   const fetchProgressData = async () => {
     setLoading(true);
     try {
       // Fetch quarterly performance data (using averages for Progress Report)
       const performanceResponse = await fetch('http://localhost/capstone-project/backend/Assessment/get_all_classes_quarterly_performance_averages.php', {
         method: 'GET',
         headers: {
           'Content-Type': 'application/json',
         },
       });
       
       // Fetch risk level data
       const riskResponse = await fetch('http://localhost/capstone-project/backend/Assessment/get_risk_level_report_data.php', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ report_type: 'progress' })
       });
       
       if (performanceResponse.ok && riskResponse.ok) {
         const performanceData = await performanceResponse.json();
         const riskData = await riskResponse.json();
         
         if (performanceData.status === 'success' && performanceData.data && riskData.status === 'success') {
           // Transform the data for bar chart display with percentage conversion
           const transformedData = {
             status: 'success',
             hasData: true,
             levelNames: performanceData.data.classes.map(classData => classData.class_name),
             quarterNames: performanceData.data.labels,
             quarterData: {},
             levelData: riskData.levelData || {},
             riskLevelData: riskData.riskLevelData || {},
             totalStudents: riskData.totalStudents || 0
           };
           
           // Process each class data
           performanceData.data.classes.forEach(classData => {
             const className = classData.class_name;
             transformedData.quarterData[className] = classData.data.map(value => {
               // Use quarter_avg_score directly as percentage (preserve decimal precision)
               if (value !== null && value !== undefined && value > 0) {
                 return parseFloat(value.toFixed(2)); // Preserve 2 decimal places
               }
               return value;
             });
           });
           
           setProgressData(transformedData);
         } else {
           setProgressData({
             status: 'success',
             hasData: false,
             levelNames: [],
             quarterNames: [],
             quarterData: {},
             levelData: {},
             riskLevelData: {},
             totalStudents: 0
           });
         }
       }
     } catch (error) {
       console.error('Error fetching progress data:', error);
     } finally {
       setLoading(false);
     }
   };

  // Fetch subject data from API
  const fetchSubjectData = async () => {
    setLoading(true);
    try {
      // Fetch risk level data
      const riskResponse = await fetch('http://localhost/capstone-project/backend/Assessment/get_risk_level_report_data.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report_type: 'subject' })
      });
      
      // Fetch subject performance data
      const subjectResponse = await fetch('http://localhost/capstone-project/backend/Assessment/get_subject_performance_data.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (riskResponse.ok && subjectResponse.ok) {
        const riskData = await riskResponse.json();
        const subjectData = await subjectResponse.json();
        
        if (riskData.status === 'success' && subjectData.status === 'success') {
          // Combine risk level data with subject performance data
          const combinedData = {
            ...riskData,
            subjectNames: subjectData.subjectNames || [],
            subjectData: subjectData.subjectData || {},
            hasSubjectData: subjectData.hasData || false
          };
          
          setSubjectData(combinedData);
        } else {
          setSubjectData(riskData);
        }
      }
    } catch (error) {
      console.error('Error fetching subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReport === "Attendance Report") {
      fetchAttendanceData();
    } else if (selectedReport === "Progress Report") {
      fetchProgressData();
    } else if (selectedReport === "Subject Report") {
      fetchSubjectData();
    }
  }, [selectedReport]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  const renderInsightSummary = () => {
         // Define colors for consistency with chart
     const levelColors = {
       "Discoverer": "text-blue-500",
       "Explorer": "text-yellow-500", 
       "Adventurer": "text-red-500"
     };

    const renderColoredLevelName = (levelName) => {
      const colorClass = levelColors[levelName] || "text-gray-700";
      return <span className={`font-semibold ${colorClass}`}>{levelName}</span>;
    };

         switch (selectedReport) {
               case "Subject Report":
          if (!subjectData || !subjectData.hasSubjectData) {
  return (
              <>
                <li className="text-center text-gray-500 text-sm">
                  <div className="mb-2">📊</div>
                  <div>No subject performance data available</div>
                  <div className="text-xs mt-1">Data will appear once subject assessments are recorded</div>
                </li>
              </>
            );
          }

          // Generate dynamic insights based on subject performance data
          const subjectInsights = [];
          
          if (subjectData.levelNames && subjectData.subjectData && subjectData.subjectNames) {
            subjectData.levelNames.forEach(levelName => {
              const classSubjectData = subjectData.subjectData[levelName] || {};
              const availableSubjects = subjectData.subjectNames.filter(subjectName => 
                classSubjectData[subjectName] && classSubjectData[subjectName] > 0
              );
              
              if (availableSubjects.length === 0) {
                subjectInsights.push(
                  <li key={levelName}>
                    {renderColoredLevelName(levelName)} - No subject performance data recorded yet. Subject tracking will begin once teachers start recording assessments.
                  </li>
                );
              } else {
                // Calculate average performance for this class
                const totalScore = availableSubjects.reduce((sum, subjectName) => 
                  sum + classSubjectData[subjectName], 0
                );
                const averageScore = totalScore / availableSubjects.length;
                
                // Find best and worst performing subjects (handle ties)
                const subjectScores = availableSubjects.map(subjectName => ({
                  name: subjectName,
                  score: classSubjectData[subjectName]
                }));
                
                const maxScore = Math.max(...subjectScores.map(s => s.score));
                const minScore = Math.min(...subjectScores.map(s => s.score));
                
                const bestSubjects = subjectScores.filter(s => s.score === maxScore);
                const worstSubjects = subjectScores.filter(s => s.score === minScore);
                
                // Generate performance insights
                if (availableSubjects.length === 1) {
                  const subject = availableSubjects[0];
                  const score = classSubjectData[subject];
                  subjectInsights.push(
                    <li key={levelName}>
                      {renderColoredLevelName(levelName)} - {subject} shows {score}% performance. This represents the current subject performance for this class.
                    </li>
                  );
                } else if (availableSubjects.length === 2) {
                  const [subject1, subject2] = availableSubjects;
                  const score1 = classSubjectData[subject1];
                  const score2 = classSubjectData[subject2];
                  const trend = score2 > score1 ? "improved" : 
                               score2 < score1 ? "decreased" : "remained stable";
                  subjectInsights.push(
                    <li key={levelName}>
                      {renderColoredLevelName(levelName)} - {subject1} shows {score1}% performance, {subject2} shows {score2}% performance. Subject performance has {trend} between these subjects.
                    </li>
                  );
                } else {
                  // Multiple subjects
                  const performanceLevel = averageScore >= 90 ? "Excellent" : 
                                         averageScore >= 80 ? "Very Good" : 
                                         averageScore >= 70 ? "Good" : 
                                         averageScore >= 60 ? "Needs Improvement" : "Not Met";
                  
                  // Handle best subjects (ties)
                  let bestSubjectText = "";
                  if (bestSubjects.length === 1) {
                    bestSubjectText = `${bestSubjects[0].name} leads with ${bestSubjects[0].score}%`;
                  } else {
                    const bestSubjectNames = bestSubjects.map(s => s.name).join(", ");
                    bestSubjectText = `${bestSubjectNames} lead with ${bestSubjects[0].score}%`;
                  }
                  
                  // Handle worst subjects (ties)
                  let worstSubjectText = "";
                  if (worstSubjects.length === 1) {
                    worstSubjectText = `${worstSubjects[0].name} needs attention at ${worstSubjects[0].score}%`;
                  } else {
                    const worstSubjectNames = worstSubjects.map(s => s.name).join(", ");
                    worstSubjectText = `${worstSubjectNames} need attention at ${worstSubjects[0].score}%`;
                  }
                  
                  subjectInsights.push(
                    <li key={levelName}>
                      {renderColoredLevelName(levelName)} - Average performance across {availableSubjects.length} subjects is {averageScore.toFixed(1)}% ({performanceLevel}). {bestSubjectText}, while {worstSubjectText}.
                    </li>
                  );
                }
              }
            });
          }

          return subjectInsights.length > 0 ? subjectInsights : (
            <>
              <li className="text-center text-gray-500 text-sm">
                <div className="mb-2">📊</div>
                <div>No subject performance data available</div>
                <div className="text-xs mt-1">Data will appear once subject assessments are recorded</div>
              </li>
            </>
          );
                 case "Progress Report":
           if (!progressData || !progressData.hasData) {
             return (
               <>
                 <li className="text-center text-gray-500 text-sm">
                   <div className="mb-2">📊</div>
                   <div>No progress data available</div>
                   <div className="text-xs mt-1">Data will appear once progress assessments are recorded</div>
                 </li>
               </>
             );
           }

           // Generate dynamic insights based on quarterly performance data
           const progressInsights = [];
           
           if (progressData.levelNames && progressData.quarterData) {
             progressData.levelNames.forEach(levelName => {
               const quarterData = progressData.quarterData[levelName] || [];
               const availableQuarters = quarterData.filter(value => value !== null && value !== undefined && value > 0);
               
                                if (availableQuarters.length === 0) {
                   progressInsights.push(
                     <li key={levelName}>
                       {renderColoredLevelName(levelName)} - No progress assessment data recorded yet. Progress tracking will begin once teachers start recording assessments.
                     </li>
                   );
                 } else {
                   // Find which quarters have data
                   const quartersWithData = [];
                   quarterData.forEach((value, index) => {
                     if (value !== null && value !== undefined && value > 0) {
                       const quarterName = progressData.quarterNames ? progressData.quarterNames[index] : `${index + 1}st Quarter`;
                       quartersWithData.push({ quarter: quarterName, percentage: value });
                     }
                   });

                   // Generate insight based on available data
                   if (quartersWithData.length === 1) {
                     const quarter = quartersWithData[0];
                     progressInsights.push(
                       <li key={levelName}>
                         {renderColoredLevelName(levelName)} - In {quarter.quarter} has achieved {quarter.percentage}% progress. This represents the current progress performance for this class.
                       </li>
                     );
                   } else if (quartersWithData.length === 2) {
                     const [first, second] = quartersWithData;
                     const trend = second.percentage > first.percentage ? "improved" : 
                                  second.percentage < first.percentage ? "decreased" : "remained stable";
                     progressInsights.push(
                       <li key={levelName}>
                         {renderColoredLevelName(levelName)} - {first.quarter} shows {first.percentage}% progress, {second.quarter} shows {second.percentage}% progress. Progress has {trend} between these quarters.
                       </li>
                     );
                   } else if (quartersWithData.length === 3) {
                     const [first, second, third] = quartersWithData;
                     const avgPercentage = ((first.percentage + second.percentage + third.percentage) / 3).toFixed(1);
                     progressInsights.push(
                       <li key={levelName}>
                         {renderColoredLevelName(levelName)} - {first.quarter} ({first.percentage}%), {second.quarter} ({second.percentage}%), and {third.quarter} ({third.percentage}%) show an average progress of {avgPercentage}% across these three quarters.
                       </li>
                     );
                   } else if (quartersWithData.length === 4) {
                     const [first, second, third, fourth] = quartersWithData;
                     const avgPercentage = ((first.percentage + second.percentage + third.percentage + fourth.percentage) / 4).toFixed(1);
                     const highestQuarter = quartersWithData.reduce((max, current) => 
                       current.percentage > max.percentage ? current : max
                     );
                     progressInsights.push(
                       <li key={levelName}>
                         {renderColoredLevelName(levelName)} - Complete year data available: {first.quarter} ({first.percentage}%), {second.quarter} ({second.percentage}%), {third.quarter} ({third.percentage}%), and {fourth.quarter} ({fourth.percentage}%). Average progress is {avgPercentage}% with {highestQuarter.quarter} showing the highest progress at {highestQuarter.percentage}%.
                       </li>
                     );
                   }
                 }
             });
           }

           return progressInsights.length > 0 ? progressInsights : (
             <>
               <li className="text-center text-gray-500 text-sm">
                 <div className="mb-2">📊</div>
                 <div>No progress data available</div>
                 <div className="text-xs mt-1">Data will appear once progress assessments are recorded</div>
               </li>
             </>
           );
      case "Attendance Report":
        if (!attendanceData || !attendanceData.hasData) {
          return (
            <>
              <li>
                No attendance data available for the current year. Attendance insights will appear once teachers start recording daily attendance.
                  </li>
                  <li>
                The system is ready to track attendance patterns across all student levels ({renderColoredLevelName("Discoverer")}, {renderColoredLevelName("Explorer")}, {renderColoredLevelName("Adventurer")}) once data becomes available.
              </li>
            </>
          );
        }

        // Generate dynamic insights based on actual attendance data
        const insights = [];
        
        if (attendanceData.levelNames && attendanceData.quarterData) {
          attendanceData.levelNames.forEach(levelName => {
            const quarterData = attendanceData.quarterData[levelName] || [];
            const availableQuarters = quarterData.filter(value => value > 0);
            
            if (availableQuarters.length === 0) {
              insights.push(
                <li key={levelName}>
                  {renderColoredLevelName(levelName)} - No attendance data recorded yet for any quarter. Attendance tracking will begin once teachers start recording daily attendance.
                </li>
              );
            } else {
              // Find which quarters have data
              const quartersWithData = [];
              quarterData.forEach((value, index) => {
                if (value > 0) {
                  const quarterName = attendanceData.quarterNames ? attendanceData.quarterNames[index] : `${index + 1}st Quarter`;
                  quartersWithData.push({ quarter: quarterName, percentage: value });
                }
              });

              // Generate insight based on available data
              if (quartersWithData.length === 1) {
                const quarter = quartersWithData[0];
                insights.push(
                  <li key={levelName}>
                    {renderColoredLevelName(levelName)} - In {quarter.quarter} has {quarter.percentage}% attendance rate. This represents the current attendance performance for this level.
                  </li>
                );
              } else if (quartersWithData.length === 2) {
                const [first, second] = quartersWithData;
                const trend = second.percentage > first.percentage ? "improved" : 
                             second.percentage < first.percentage ? "decreased" : "remained stable";
                insights.push(
                  <li key={levelName}>
                    {renderColoredLevelName(levelName)} - {first.quarter} shows {first.percentage}% attendance, {second.quarter} shows {second.percentage}% attendance. Attendance has {trend} between these quarters.
                  </li>
                );
              } else if (quartersWithData.length === 3) {
                const [first, second, third] = quartersWithData;
                const avgPercentage = ((first.percentage + second.percentage + third.percentage) / 3).toFixed(1);
                insights.push(
                  <li key={levelName}>
                    {renderColoredLevelName(levelName)} - {first.quarter} ({first.percentage}%), {second.quarter} ({second.percentage}%), and {third.quarter} ({third.percentage}%) show an average attendance rate of {avgPercentage}% across these three quarters.
                  </li>
                );
              } else if (quartersWithData.length === 4) {
                const [first, second, third, fourth] = quartersWithData;
                const avgPercentage = ((first.percentage + second.percentage + third.percentage + fourth.percentage) / 4).toFixed(1);
                const highestQuarter = quartersWithData.reduce((max, current) => 
                  current.percentage > max.percentage ? current : max
                );
                insights.push(
                  <li key={levelName}>
                    {renderColoredLevelName(levelName)} - Complete year data available: {first.quarter} ({first.percentage}%), {second.quarter} ({second.percentage}%), {third.quarter} ({third.percentage}%), and {fourth.quarter} ({fourth.percentage}%). Average attendance is {avgPercentage}% with {highestQuarter.quarter} showing the highest rate at {highestQuarter.percentage}%.
                  </li>
                );
              }
            }
          });
        }

        return insights.length > 0 ? insights : (
          <>
            <li>
              Attendance data is being processed. Please wait for the analysis to complete.
                  </li>
                </>
        );
      default:
        return null;
    }
  };

  const renderRightCard = () => {
    switch (selectedReport) {
             case "Attendance Report":
         if (loading) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Total of Student
               </h3>
               <div className="text-center text-gray-500 text-sm">Loading...</div>
             </>
           );
         }
         
         if (!attendanceData) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Total of Student
               </h3>
               <div className="text-center text-gray-500 text-sm">No data available</div>
             </>
           );
         }

         // Check if we have any student data
         if (!attendanceData.hasData && attendanceData.levelNames.length === 0) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Total of Student
               </h3>
               <div className="text-center text-gray-500 text-sm p-2">
                 {attendanceData.message || 'No students found in the system yet.'}
          </div>
             </>
           );
         }

         const colors = ["text-blue-500", "text-yellow-500", "text-red-500"];

         return (
              <>
             <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                  Total of Student
                </h3>
             {attendanceData.message && (
               <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                 {attendanceData.message}
               </div>
             )}
                <div className="border border-gray-100 rounded-lg p-2">
                <table className="text-xs sm:text-sm text-gray-700 w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left"></th>
                   {attendanceData.levelNames.map((levelName, index) => (
                     <th key={levelName} className={`text-center font-medium ${colors[index]}`}>
                       {levelName}
                     </th>
                   ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 flex items-center gap-2">
                        <FaMars className="text-blue-500" />
                        <span className="text-blue-500">Male</span>
                      </td>
                   {attendanceData.levelNames.map(levelName => (
                     <td key={`male-${levelName}`} className="text-center">
                       {attendanceData.levelData[levelName]?.Male || 0}
                     </td>
                   ))}
                    </tr>
                    <tr>
                      <td className="py-1 flex items-center gap-2">
                        <FaVenus className="text-pink-500" />
                        <span className="text-pink-500">Female</span>
                      </td>
                   {attendanceData.levelNames.map(levelName => (
                     <td key={`female-${levelName}`} className="text-center">
                       {attendanceData.levelData[levelName]?.Female || 0}
                     </td>
                   ))}
                 </tr>
                 <tr className="font-semibold">
                   <td className="py-1 flex items-center gap-2">
                     <FaUsers className="text-green-500" />
                     <span className="text-green-500">Total</span>
                   </td>
                   {attendanceData.levelNames.map(levelName => (
                     <td key={`total-${levelName}`} className="text-center">
                       {attendanceData.levelData[levelName]?.Total || 0}
                     </td>
                   ))}
                 </tr>
               </tbody>
              </table>
              </div>
           </>
         );
             case "Progress Report":
         if (loading) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Risk Level
               </h3>
               <div className="text-center text-gray-500 text-sm">Loading...</div>
             </>
           );
         }
         
         if (!progressData) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Risk Level
               </h3>
               <div className="text-center text-gray-500 text-sm">No data available</div>
             </>
           );
         }

         // Check if we have any progress data
         if (!progressData.hasData && progressData.levelNames.length === 0) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Risk Level
               </h3>
               <div className="text-center text-gray-500 text-sm p-2">
                 {progressData.message || 'No progress data found yet.'}
               </div>
             </>
           );
         }

         const progressColors = ["text-blue-500", "text-yellow-500", "text-red-500"];
         
         return (
           <>
             <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
               Risk Level
             </h3>
             {progressData.message && (
               <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                 {progressData.message}
               </div>
             )}
              <div className="border border-gray-100 rounded-lg p-2">
              <table className="text-xs sm:text-sm text-gray-700 w-full">
               <thead className="border-b">
                 <tr>
                   <th className="text-left"></th>
                   {progressData.levelNames.map((levelName, index) => (
                     <th key={levelName} className={`text-center font-medium ${progressColors[index]}`}>
                       {levelName}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td className="py-0.5 flex items-center gap-2">
                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                     <span className="text-green-600">Low</span>
                   </td>
                   {progressData.levelNames.map(levelName => (
                     <td key={`low-${levelName}`} className="text-center">
                       {progressData.riskLevelData[levelName]?.['Low'] || 0}
                     </td>
                   ))}
                 </tr>
                 <tr>
                   <td className="py-0.5 flex items-center gap-2">
                     <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                     <span className="text-yellow-600">Moderate</span>
                   </td>
                   {progressData.levelNames.map(levelName => (
                     <td key={`moderate-${levelName}`} className="text-center">
                       {progressData.riskLevelData[levelName]?.['Moderate'] || 0}
                     </td>
                   ))}
                 </tr>
                                   <tr>
                    <td className="py-0.5 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-600">High</span>
                    </td>
                    {progressData.levelNames.map(levelName => (
                      <td key={`high-${levelName}`} className="text-center">
                        {progressData.riskLevelData[levelName]?.['High'] || 0}
                      </td>
                    ))}
                  </tr>
                  
                  <tr className="font-semibold">
                    <td className="py-0.5 flex items-center gap-2">
                      <FaUsers className="text-green-500" />
                      <span className="text-green-500">Total</span>
                    </td>
                    {progressData.levelNames.map(levelName => (
                      <td key={`total-${levelName}`} className="text-center">
                        {progressData.riskLevelData[levelName]?.['Total'] || 0}
                      </td>
                    ))}
                  </tr>
               </tbody>
              </table>
              </div>
           </>
         );
       case "Subject Report":
         if (loading) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Risk Level
               </h3>
               <div className="text-center text-gray-500 text-sm">Loading...</div>
             </>
           );
         }
         
         if (!subjectData) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Risk Level
               </h3>
               <div className="text-center text-gray-500 text-sm">No data available</div>
             </>
           );
         }

         // Check if we have any subject data
         if (!subjectData.hasData && subjectData.levelNames.length === 0) {
           return (
             <>
               <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
                 Risk Level
               </h3>
               <div className="text-center text-gray-500 text-sm p-2">
                 {subjectData.message || 'No subject data found yet.'}
               </div>
             </>
           );
         }

         const subjectColors = ["text-blue-500", "text-yellow-500", "text-red-500"];
         
         return (
           <>
             <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
               Risk Level
             </h3>
             {subjectData.message && (
               <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                 {subjectData.message}
               </div>
             )}
              <div className="border border-gray-100 rounded-lg p-2">
              <table className="text-xs sm:text-sm text-gray-700 w-full">
               <thead className="border-b">
                 <tr>
                   <th className="text-left"></th>
                   {subjectData.levelNames.map((levelName, index) => (
                     <th key={levelName} className={`text-center font-medium ${subjectColors[index]}`}>
                       {levelName}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td className="py-0.5 flex items-center gap-2">
                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                     <span className="text-green-600">Low</span>
                   </td>
                   {subjectData.levelNames.map(levelName => (
                     <td key={`low-${levelName}`} className="text-center">
                       {subjectData.riskLevelData[levelName]?.['Low'] || 0}
                     </td>
                   ))}
                 </tr>
                 <tr>
                   <td className="py-0.5 flex items-center gap-2">
                     <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                     <span className="text-yellow-600">Moderate</span>
                   </td>
                   {subjectData.levelNames.map(levelName => (
                     <td key={`moderate-${levelName}`} className="text-center">
                       {subjectData.riskLevelData[levelName]?.['Moderate'] || 0}
                     </td>
                   ))}
                 </tr>
                                   <tr>
                    <td className="py-0.5 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-600">High</span>
                    </td>
                    {subjectData.levelNames.map(levelName => (
                      <td key={`high-${levelName}`} className="text-center">
                        {subjectData.riskLevelData[levelName]?.['High'] || 0}
                      </td>
                    ))}
                    </tr>
                  
                    <tr className="font-semibold">
                      <td className="py-0.5 flex items-center gap-2">
                        <FaUsers className="text-green-500" />
                        <span className="text-green-500">Total</span>
                      </td>
                      {subjectData.levelNames.map(levelName => (
                        <td key={`total-${levelName}`} className="text-center">
                          {subjectData.riskLevelData[levelName]?.['Total'] || 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              </>
         );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute role="Super Admin">
      <div className="flex-1 p-2 pt-0">
        <div className="flex justify-between items-center mb-2 bg-[#232c67] text-white p-2 rounded-none">
          <h2 className="text-base sm:text-2xl font-semibold text-white ml-4">
            {selectedReport}
          </h2>
          
          {/* Dropdown Selector */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View Report
              <FaChevronDown className={`text-xs transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {reports.map((report) => (
                    <button
                      key={report}
                      onClick={() => {
                        setSelectedReport(report);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                        selectedReport === report 
                          ? "bg-[#232c67] text-white hover:bg-gray-100 hover:text-black" 
                          : "text-gray-900 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      {report}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-2 items-start">
          <div className="bg-white p-2 rounded-xl shadow-md col-span-1 lg:col-span-2">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2">
              Insight Summary
            </h3>
            <div className="border border-gray-100 rounded-lg p-2">
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc pl-4">
                {renderInsightSummary()}
              </ul>
            </div>
          </div>

          <div className="bg-white p-2 rounded-xl shadow-md">
            {renderRightCard()}
          </div>
        </div>

        <div className="bg-white p-2 rounded-xl shadow-md relative">
            <div style={{ height: '250px' }}>
              <Bar data={chartData} options={chartOptions} />
              {selectedReport === "Attendance Report" && attendanceData && !attendanceData.hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                  <div className="text-center text-gray-500 text-sm p-4">
                    <div className="mb-2">📊</div>
                    <div>No attendance data available</div>
                    <div className="text-xs mt-1">Data will appear once teachers start recording attendance</div>
                  </div>
                </div>
              )}
                             {selectedReport === "Progress Report" && progressData && !progressData.hasData && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                   <div className="text-center text-gray-500 text-sm p-4">
                     <div className="mb-2">📊</div>
                     <div>No progress data available</div>
                     <div className="text-xs mt-1">Data will appear once progress assessments are recorded</div>
                   </div>
                 </div>
               )}
               {selectedReport === "Subject Report" && subjectData && !subjectData.hasData && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                   <div className="text-center text-gray-500 text-sm p-4">
                     <div className="mb-2">📊</div>
                     <div>No subject data available</div>
                     <div className="text-xs mt-1">Data will appear once subject assessments are recorded</div>
                   </div>
                 </div>
               )}
            </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
