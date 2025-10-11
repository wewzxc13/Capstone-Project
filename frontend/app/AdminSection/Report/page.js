"use client";

import { useState, useEffect, useRef } from "react";
import { Bar, Line } from "react-chartjs-2";
import '../../../lib/chart-config.js';
import { FaBell, FaCog, FaChevronDown, FaEdit, FaMale, FaFemale, FaUsers, FaMars, FaVenus, FaPrint } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import AdminReportDownload from './AdminReportDownload';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API } from '@/config/api';

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState("Attendance Report");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const printRef = useRef(null);

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
      const response = await fetch(API.advisory.getAttendanceReportData(), {
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
       const performanceResponse = await fetch(API.assessment.getAllClassesQuarterlyPerformanceAverages(), {
         method: 'GET',
         headers: {
           'Content-Type': 'application/json',
         },
       });
       
       // Fetch risk level data
       const riskResponse = await fetch(API.assessment.getRiskLevelReportData(), {
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
      const riskResponse = await fetch(API.assessment.getRiskLevelReportData(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report_type: 'subject' })
      });
      
      // Fetch subject performance data
      const subjectResponse = await fetch(API.assessment.getSubjectPerformanceData(), {
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
    // Always fetch all data regardless of selected report
    fetchAttendanceData();
    fetchProgressData();
    fetchSubjectData();
  }, []); // Remove selectedReport dependency to fetch all data once

  // Update the current report display when selectedReport changes
  useEffect(() => {
    // This effect can be used for any UI updates based on selectedReport
    // but we don't need to refetch data since we have it all
  }, [selectedReport]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  // Download PDF function
  const handleDownloadReport = async () => {
    try {
      // Show loading toast
      toast.info("Generating PDF...", { autoClose: 5000 });

      // Create PDF directly using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      let currentY = 20;

      // Helper function to add text with word wrap
      const addText = (text, x, y, maxWidth = pageWidth - 40) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * 5);
      };

      // Helper function to add a new page with colored background
      const addNewPage = (bgColor) => {
        pdf.addPage();
        // Fill entire page with background color
        pdf.setFillColor(bgColor);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = 20;
      };

      // Helper function to add header with logo
      const addHeader = async (title) => {
        if (currentY > 250) addNewPage('#eef5ff');
        
        // Logo positioning - left side with proper alignment
        const logoX = 20;
        const logoY = currentY + 15;
        const logoSize = 30; // Reduced logo size
        const logoRadius = 15; // Reduced radius
        
        try {
          // Try to load and add the school logo
          const logoResponse = await fetch('/assets/image/villelogo.png');
          if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(logoBlob);
            });
            
            // Draw circular background for logo
            pdf.setFillColor(255, 255, 255); // White background
            pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F'); // White circle background
            pdf.setDrawColor(200, 200, 200); // Light gray border
            pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S'); // Circle border
            
            // Add logo centered in the circle
            pdf.addImage(logoDataUrl, 'PNG', logoX + 2, logoY - logoRadius + 2, logoSize - 4, logoSize - 4);
          }
        } catch (error) {
          console.log('Could not load logo, using text fallback');
          // Draw empty circle if logo fails to load
          pdf.setFillColor(255, 255, 255); // White background
          pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F'); // White circle background
          pdf.setDrawColor(200, 200, 200); // Light gray border
          pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S'); // Circle border
        }
        
        // School name - centered on page, aligned with logo center
        pdf.setTextColor(35, 44, 103); // Dark blue color
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LEARNERS\' VILLE', pageWidth / 2, logoY + 2, { align: 'center' });
        
        // Address - centered below school name
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Black color
        pdf.text('6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines', pageWidth / 2, logoY + 10, { align: 'center' });
        
        // Separator line
        pdf.setDrawColor(100, 100, 100); // Dark gray line
        pdf.setLineWidth(0.5);
        pdf.line(10, logoY + 20, pageWidth - 10, logoY + 20);
        
        // Title - centered below separator
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, pageWidth / 2, logoY + 35, { align: 'center' });
        
        currentY = logoY + 50; // Set currentY for next content
      };

      // Helper function to start a white box
      const startWhiteBox = (boxHeight = 60) => {
        const footerTopY = pageHeight - 30; // Keep clear area for footer
        // If the box would collide with footer, move to a new page first
        if ((currentY - 5) + boxHeight > footerTopY) {
          addNewPage('#eef5ff');
        }
        const boxStartY = currentY - 5;
        const boxEndY = boxStartY + boxHeight;
        
        // Draw white background box (further reduced side margins)
        pdf.setFillColor(255, 255, 255); // White
        pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'F');
        
        // Draw border
        pdf.setDrawColor(200, 200, 200); // Light gray
        pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'S');
        
        return { boxStartY, boxEndY };
      };

      // Helper function to end a white box
      const endWhiteBox = (boxEndY) => {
        currentY = boxEndY + 8; // Reduced spacing
      };

      // Helper function to add a chart in a white box
      const addChartBox = (data, labels, title, colors) => {
        // Start white box
        const { boxStartY, boxEndY } = startWhiteBox(90);
        
        // Add centered legend at the top - positioned within white box
        const legendY = boxStartY + 15;
        const legendSpacing = 45; // Reduced space between legend items
        const totalLegendWidth = data.length * legendSpacing;
        const startX = (pageWidth - totalLegendWidth) / 2; // Center the legend
        
        data.forEach((dataset, index) => {
          const x = startX + (index * legendSpacing);
          if (x < pageWidth - 20) {
            // Color box
            pdf.setFillColor(colors[index] || '#60a5fa');
            pdf.rect(x, legendY - 2, 6, 6, 'F');
            // Label
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(dataset.label, x + 10, legendY + 2);
          }
        });

        // Add bar chart representation
        const chartWidth = pageWidth - 40; // widen more
        const chartHeight = 50; // Reduced chart height
        const barGroupWidth = chartWidth / labels.length;
        const chartStartX = 28; // shift slightly right to avoid overlapping y-labels
        const barSpacing = 5; // Slightly more space between bars
        const chartStartY = boxStartY + 30; // Position chart within white box
        
        // Y-axis labels
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        for (let i = 0; i <= 5; i++) {
          const value = i * 20;
          const y = chartStartY + chartHeight - (i * 10);
          pdf.text(`${value}%`, 12, y); // move further left
        }

        // Draw grid lines
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        for (let i = 0; i <= 5; i++) {
          const y = chartStartY + chartHeight - (i * 10);
          pdf.line(chartStartX, y, chartStartX + chartWidth, y);
        }

        // Draw bars
        labels.forEach((label, labelIndex) => {
          const groupX = chartStartX + (labelIndex * barGroupWidth);
          const baseBarWidth = (barGroupWidth - (data.length - 1) * barSpacing) / data.length;
          const individualBarWidth = baseBarWidth * 0.85; // reduce bar width slightly
          
          data.forEach((dataset, datasetIndex) => {
            const value = dataset.data[labelIndex] || 0;
            const barHeight = (value / 100) * chartHeight;
            const barY = chartStartY + chartHeight - barHeight;
            const barX = groupX + (datasetIndex * (individualBarWidth + barSpacing)) + 1;
            
            if (value > 0) {
              pdf.setFillColor(colors[datasetIndex] || '#60a5fa');
              pdf.rect(barX, barY, individualBarWidth, barHeight, 'F');
            }
          });
          
          // X-axis label - centered below each group, within the white box
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(label, groupX + barGroupWidth/2, chartStartY + chartHeight + 8, { align: 'center' });
        });
        
        // End white box
        endWhiteBox(boxEndY);
      };

      // Helper function to add insights in a white box
      const addInsightsBox = (insights) => {
        // Calculate optimal box height based on content
        const titleHeight = 20; // Title + spacing
        const insightsHeight = insights.length * 20; // 2 lines per insight + spacing
        const calculatedBoxHeight = titleHeight + insightsHeight + 10; // Small bottom padding
        
        // Start white box with calculated height
        let { boxStartY, boxEndY } = startWhiteBox(calculatedBoxHeight);
        
        // Add insights title - positioned within white box
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Insight Summary', 12, boxStartY + 12);
        
        // Add insights text with colored class names and proper wrapping
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        let currentTextY = boxStartY + 24; // Start text closer to title
        
        insights.forEach((insight, index) => {
          // Check if we need to go to next page
          if (currentTextY > boxEndY - 20) {
            // Close the current box cleanly before moving
            endWhiteBox(boxEndY);
            addNewPage('#eef5ff');
            const newBox = startWhiteBox(calculatedBoxHeight);
            // Reset available region for new box
            boxStartY = newBox.boxStartY;
            boxEndY = newBox.boxEndY;
            currentTextY = newBox.boxStartY + 24;
          }
          
          // Process insight text to add colors to class names
          let processedInsight = insight;
          const classColors = {
            'Discoverer': [96, 165, 250], // Blue
            'Explorer': [250, 204, 21],   // Yellow
            'Adventurer': [248, 113, 113] // Red
          };
          
          // Use maximum available width
          const contentX = 12; // minimal left padding
          const indentX = 16; // slight indentation for second line
          const maxWidthLine1 = pageWidth - 24; // maximize width usage
          const maxWidthLine2 = pageWidth - 28; // account for indentation
          
          // Split text into exactly 2 lines using full width
          const fullText = `${index + 1}. ${processedInsight}`;
          const lines = pdf.splitTextToSize(fullText, maxWidthLine1);
          
          // First line
          const line1 = lines[0] || fullText;
          addColoredText(line1, contentX, currentTextY, classColors);
          currentTextY += 8;
          
          // Second line - combine remaining text
          if (lines.length > 1) {
            const remainingText = lines.slice(1).join(' ').trim();
            const secondLines = pdf.splitTextToSize(remainingText, maxWidthLine2);
            const line2 = secondLines[0] || remainingText;
            addColoredText(line2, indentX, currentTextY, classColors);
            currentTextY += 8;
          }
          
          currentTextY += 4; // Extra spacing between insights
        });
        
        // End white box
        endWhiteBox(boxEndY);
      };
      
      // Helper function to add colored text (simplified - no truncation)
      const addColoredText = (text, x, y, classColors) => {
        const classNames = Object.keys(classColors);
        let currentX = x;
        let remainingText = text;
        
        // Find first class name in the text
        let firstClassIndex = -1;
        let firstClassName = '';
        classNames.forEach(className => {
          const index = remainingText.indexOf(className);
          if (index !== -1 && (firstClassIndex === -1 || index < firstClassIndex)) {
            firstClassIndex = index;
            firstClassName = className;
          }
        });
        
        if (firstClassIndex !== -1) {
          // Add text before class name
          if (firstClassIndex > 0) {
            const beforeText = remainingText.substring(0, firstClassIndex);
            pdf.setTextColor(0, 0, 0); // Black
            pdf.text(beforeText, currentX, y);
            currentX += pdf.getTextWidth(beforeText);
          }
          
          // Add colored class name
          const color = classColors[firstClassName];
          pdf.setTextColor(color[0], color[1], color[2]);
          pdf.setFont('helvetica', 'bold'); // Make class name bold
          pdf.text(firstClassName, currentX, y);
          currentX += pdf.getTextWidth(firstClassName);
          
          // Add remaining text in black
          const afterText = remainingText.substring(firstClassIndex + firstClassName.length);
          pdf.setTextColor(0, 0, 0); // Black
          pdf.setFont('helvetica', 'normal');
          pdf.text(afterText, currentX, y);
        } else {
          // No class name found, just add the text
          pdf.setTextColor(0, 0, 0); // Black
          pdf.text(remainingText, currentX, y);
        }
      };

      // Set first page background color
      pdf.setFillColor(238, 245, 255); // Light blue
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Page 1: Attendance Report
      await addHeader('Attendance Report');
      
      if (attendanceData && attendanceData.hasData) {
        // Create attendance chart data
        const attendanceChartData = attendanceData.levelNames.map((levelName, index) => ({
          label: levelName,
          data: attendanceData.quarterData[levelName] || [0, 0, 0, 0]
        }));
        
        // Add chart in white box
        addChartBox(
          attendanceChartData,
          attendanceData.quarterNames || ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'],
          'Attendance Percentage',
          ['#60a5fa', '#facc15', '#f87171']
        );

        // Add insights in white box
        const attendanceInsights = renderAttendanceInsights();
        addInsightsBox(attendanceInsights);
      } else {
        addWhiteBox(() => {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          currentY = addText('No attendance data available for the current year.', 25, currentY + 5);
        }, 30);
      }

      // Page 2: Progress Report
      addNewPage('#eaf7f1'); // Light green
      await addHeader('Progress Report');
      
      if (progressData && progressData.hasData) {
        // Create progress chart data
        const progressChartData = progressData.levelNames.map((levelName, index) => ({
          label: levelName,
          data: progressData.quarterData[levelName] || [0, 0, 0, 0]
        }));
        
        // Add chart in white box
        addChartBox(
          progressChartData,
          progressData.quarterNames || ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'],
          'Progress Percentage',
          ['#5C9EFF', '#FDCB44', '#FF7B7B']
        );

        // Add insights in white box
        const progressInsights = renderProgressInsights();
        addInsightsBox(progressInsights);
      } else {
        addWhiteBox(() => {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          currentY = addText('No progress data available for the current year.', 25, currentY + 5);
        }, 30);
      }

      // Page 3: Subject Report
      addNewPage('#fff7e6'); // Light yellow
      await addHeader('Subject Report');
      
      if (subjectData && subjectData.hasSubjectData) {
        // Create subject chart data
        const subjectChartData = subjectData.levelNames.map((levelName, index) => ({
          label: levelName,
          data: subjectData.subjectNames.map(subjectName => 
            subjectData.subjectData[levelName]?.[subjectName] || 0
          )
        }));
        
        // Add chart in white box
        addChartBox(
          subjectChartData,
          subjectData.subjectNames || [],
          'Subject Performance',
          ['#5C9EFF', '#FDCB44', '#FF7B7B']
        );

        // Add insights in white box
        const subjectInsights = renderSubjectInsights();
        addInsightsBox(subjectInsights);
      } else {
        addWhiteBox(() => {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          currentY = addText('No subject data available for the current year.', 25, currentY + 5);
        }, 30);
      }

      // Add footer to each page (outside white boxes)
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} | School Year ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      }

      // Download the PDF
      const fileName = `Learners_Ville_Reports_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF downloaded successfully!");
      
    } catch (err) {
      console.error('Error downloading report:', err);
      toast.error("Failed to download. Please try again.");
    }
  };

  // Helper function to get insights for a specific report type
  const getInsightsForReport = (reportType) => {
    const originalReport = selectedReport;
    // Temporarily set the report type to get insights
    if (reportType === "Attendance Report") {
      return renderAttendanceInsights();
    } else if (reportType === "Progress Report") {
      return renderProgressInsights();
    } else if (reportType === "Subject Report") {
      return renderSubjectInsights();
    }
    return [];
  };

  // Helper function to render attendance insights
  const renderAttendanceInsights = () => {
    if (!attendanceData || !attendanceData.hasData) {
      return [
        "No attendance data available for the current year. Attendance insights will appear once teachers start recording daily attendance for students linked to parents.",
        "The system is ready to track attendance patterns across all student levels (Discoverer, Explorer, Adventurer) once data becomes available."
      ];
    }

    const insights = [];
    if (attendanceData.levelNames && attendanceData.quarterData) {
      attendanceData.levelNames.forEach(levelName => {
        const quarterData = attendanceData.quarterData[levelName] || [];
        const availableQuarters = quarterData.filter(value => value > 0);
        
        if (availableQuarters.length === 0) {
          insights.push(`${levelName} - No attendance data recorded yet for any quarter. Attendance tracking will begin once teachers start recording daily attendance.`);
        } else {
          const quartersWithData = [];
          quarterData.forEach((value, index) => {
            if (value > 0) {
              const quarterName = attendanceData.quarterNames ? attendanceData.quarterNames[index] : `${index + 1}st Quarter`;
              quartersWithData.push({ quarter: quarterName, percentage: value });
            }
          });

          if (quartersWithData.length === 1) {
            const quarter = quartersWithData[0];
            insights.push(`${levelName} - In ${quarter.quarter} has ${quarter.percentage}% attendance rate. This represents the current attendance performance for this level.`);
          } else if (quartersWithData.length === 2) {
            const [first, second] = quartersWithData;
            const trend = second.percentage > first.percentage ? "improved" : 
                         second.percentage < first.percentage ? "decreased" : "remained stable";
            insights.push(`${levelName} - ${first.quarter} shows ${first.percentage}% attendance, ${second.quarter} shows ${second.percentage}% attendance. Attendance has ${trend} between these quarters.`);
          } else if (quartersWithData.length === 3) {
            const [first, second, third] = quartersWithData;
            const avgPercentage = ((first.percentage + second.percentage + third.percentage) / 3).toFixed(1);
            insights.push(`${levelName} - ${first.quarter} (${first.percentage}%), ${second.quarter} (${second.percentage}%), and ${third.quarter} (${third.percentage}%) show an average attendance rate of ${avgPercentage}% across these three quarters.`);
          } else if (quartersWithData.length === 4) {
            const [first, second, third, fourth] = quartersWithData;
            const avgPercentage = ((first.percentage + second.percentage + third.percentage + fourth.percentage) / 4).toFixed(1);
            const highestQuarter = quartersWithData.reduce((max, current) => 
              current.percentage > max.percentage ? current : max
            );
            insights.push(`${levelName} - Complete year data available: ${first.quarter} (${first.percentage}%), ${second.quarter} (${second.percentage}%), ${third.quarter} (${third.percentage}%), and ${fourth.quarter} (${fourth.percentage}%). Average attendance is ${avgPercentage}% with ${highestQuarter.quarter} showing the highest rate at ${highestQuarter.percentage}%.`);
          }
        }
      });
    }
    return insights;
  };

  // Helper function to render progress insights
  const renderProgressInsights = () => {
    if (!progressData || !progressData.hasData) {
      return [
        "No progress data available. Data will appear once progress assessments are recorded for students linked to parents."
      ];
    }

    const insights = [];
    if (progressData.levelNames && progressData.quarterData) {
      progressData.levelNames.forEach(levelName => {
        const quarterData = progressData.quarterData[levelName] || [];
        const availableQuarters = quarterData.filter(value => value !== null && value !== undefined && value > 0);
        
        if (availableQuarters.length === 0) {
          insights.push(`${levelName} - No progress assessment data recorded yet. Progress tracking will begin once teachers start recording assessments for students linked to parents.`);
        } else {
          const quartersWithData = [];
          quarterData.forEach((value, index) => {
            if (value !== null && value !== undefined && value > 0) {
              const quarterName = progressData.quarterNames ? progressData.quarterNames[index] : `${index + 1}st Quarter`;
              quartersWithData.push({ quarter: quarterName, percentage: value });
            }
          });

          if (quartersWithData.length === 1) {
            const quarter = quartersWithData[0];
            insights.push(`${levelName} - In ${quarter.quarter} has achieved ${quarter.percentage}% progress. This represents the current progress performance for this class.`);
          } else if (quartersWithData.length === 2) {
            const [first, second] = quartersWithData;
            const trend = second.percentage > first.percentage ? "improved" : 
                         second.percentage < first.percentage ? "decreased" : "remained stable";
            insights.push(`${levelName} - ${first.quarter} shows ${first.percentage}% progress, ${second.quarter} shows ${second.percentage}% progress. Progress has ${trend} between these quarters.`);
          } else if (quartersWithData.length === 3) {
            const [first, second, third] = quartersWithData;
            const avgPercentage = ((first.percentage + second.percentage + third.percentage) / 3).toFixed(1);
            insights.push(`${levelName} - ${first.quarter} (${first.percentage}%), ${second.quarter} (${second.percentage}%), and ${third.quarter} (${third.percentage}%) show an average progress of ${avgPercentage}% across these three quarters.`);
          } else if (quartersWithData.length === 4) {
            const [first, second, third, fourth] = quartersWithData;
            const avgPercentage = ((first.percentage + second.percentage + third.percentage + fourth.percentage) / 4).toFixed(1);
            const highestQuarter = quartersWithData.reduce((max, current) => 
              current.percentage > max.percentage ? current : max
            );
            insights.push(`${levelName} - Complete year data available: ${first.quarter} (${first.percentage}%), ${second.quarter} (${second.percentage}%), ${third.quarter} (${third.percentage}%), and ${fourth.quarter} (${fourth.percentage}%). Average progress is ${avgPercentage}% with ${highestQuarter.quarter} showing the highest progress at ${highestQuarter.percentage}%.`);
          }
        }
      });
    }
    return insights;
  };

  // Helper function to render subject insights
  const renderSubjectInsights = () => {
    if (!subjectData || !subjectData.hasSubjectData) {
      return [
        "No subject performance data available. Data will appear once subject assessments are recorded for students linked to parents."
      ];
    }

    const insights = [];
    if (subjectData.levelNames && subjectData.subjectData && subjectData.subjectNames) {
      subjectData.levelNames.forEach(levelName => {
        const classSubjectData = subjectData.subjectData[levelName] || {};
        const availableSubjects = subjectData.subjectNames.filter(subjectName => 
          classSubjectData[subjectName] && classSubjectData[subjectName] > 0
        );
        
        if (availableSubjects.length === 0) {
          insights.push(`${levelName} - No subject performance data recorded yet. Subject tracking will begin once teachers start recording assessments for students linked to parents.`);
        } else {
          const totalScore = availableSubjects.reduce((sum, subjectName) => 
            sum + classSubjectData[subjectName], 0
          );
          const averageScore = totalScore / availableSubjects.length;
          
          if (availableSubjects.length === 1) {
            const subject = availableSubjects[0];
            const score = classSubjectData[subject];
            insights.push(`${levelName} - ${subject} shows ${score}% performance. This represents the current subject performance for this class.`);
          } else {
            const performanceLevel = averageScore >= 90 ? "Excellent" : 
                                   averageScore >= 80 ? "Very Good" : 
                                   averageScore >= 70 ? "Good" : 
                                   averageScore >= 60 ? "Needs Improvement" : "Not Met";
            insights.push(`${levelName} - Average performance across ${availableSubjects.length} subjects is ${averageScore.toFixed(1)}% (${performanceLevel}). Shows comprehensive subject tracking.`);
          }
        }
      });
    }
    return insights;
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
                  <div className="text-xs mt-1">Data will appear once subject assessments are recorded for students linked to parents</div>
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
                    {renderColoredLevelName(levelName)} - No subject performance data recorded yet. Subject tracking will begin once teachers start recording assessments for students linked to parents.
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
                   <div className="text-xs mt-1">Data will appear once progress assessments are recorded for students linked to parents</div>
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
                       {renderColoredLevelName(levelName)} - No progress assessment data recorded yet. Progress tracking will begin once teachers start recording assessments for students linked to parents.
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
                No attendance data available for the current year. Attendance insights will appear once teachers start recording daily attendance for students linked to parents.
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
                 {attendanceData.message || 'No active students linked to parents found in the system yet.'}
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
                 {progressData.message || 'No active students linked to parents found yet.'}
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
                 {subjectData.message || 'No active students linked to parents found yet.'}
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
    <ProtectedRoute role="Admin">
      <div className="flex-1 p-2 pt-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-2 bg-[#232c67] text-white p-2 rounded-none">
          <h2 className="text-base sm:text-2xl font-semibold text-white sm:ml-4">
            {selectedReport}
          </h2>

          {/* Download Button and Dropdown Container */}
          <div className="flex w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Download Button */}
            <button
              onClick={handleDownloadReport}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 min-w-0"
              title="Download Report to PDF"
            >
              <FaPrint className="text-sm shrink-0" />
              <span className="hidden sm:inline">Download Reports</span>
              <span className="sm:hidden">Download</span>
            </button>

            {/* Dropdown Selector */}
            <div className="relative dropdown-container flex-1 sm:flex-none">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="hidden sm:inline">View Report</span>
                <span className="sm:hidden">View</span>
                <FaChevronDown className={`text-xs transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
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
            <div style={{ height: '230px' }}>
              <Bar data={chartData} options={chartOptions} />
              {selectedReport === "Attendance Report" && attendanceData && !attendanceData.hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                  <div className="text-center text-gray-500 text-sm p-4">
                    <div className="mb-2">📊</div>
                    <div>No attendance data available</div>
                    <div className="text-xs mt-1">Data will appear once teachers start recording attendance for students linked to parents</div>
                  </div>
                </div>
              )}
                             {selectedReport === "Progress Report" && progressData && !progressData.hasData && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                   <div className="text-center text-gray-500 text-sm p-4">
                     <div className="mb-2">📊</div>
                     <div>No progress data available</div>
                     <div className="text-xs mt-1">Data will appear once progress assessments are recorded for students linked to parents</div>
                   </div>
                 </div>
               )}
               {selectedReport === "Subject Report" && subjectData && !subjectData.hasData && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                   <div className="text-center text-gray-500 text-sm p-4">
                     <div className="mb-2">📊</div>
                     <div>No subject data available</div>
                     <div className="text-xs mt-1">Data will appear once subject assessments are recorded for students linked to parents</div>
                   </div>
                 </div>
               )}
            </div>
        </div>

        {/* Admin Report Export Component */}
        <div ref={printRef} className="hidden print:block" style={{margin: 0, padding: 0}}>
          {attendanceData && progressData && subjectData && (
          <AdminReportDownload
            attendanceData={attendanceData}
            progressData={progressData}
            subjectData={subjectData}
            attendanceChartData={(() => {
              // Create attendance chart data - always return data structure
              const labels = attendanceData?.quarterNames || ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
              const levelNames = attendanceData?.levelNames || ["Discoverer", "Explorer", "Adventurer"];
              
              return {
                labels: labels,
                datasets: levelNames.map((levelName, index) => ({
                  label: levelName,
                  data: attendanceData?.quarterData?.[levelName] || [0, 0, 0, 0],
                  backgroundColor: ["#60a5fa", "#facc15", "#f87171"][index] || "#60a5fa",
                }))
              };
            })()}
            progressChartData={(() => {
              // Create progress chart data - always return data structure
              const labels = progressData?.quarterNames || ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
              const levelNames = progressData?.levelNames || ["Discoverer", "Explorer", "Adventurer"];
              
              return {
                labels: labels,
                datasets: levelNames.map((levelName, index) => ({
                  label: levelName,
                  data: progressData?.quarterData?.[levelName] || [0, 0, 0, 0],
                  backgroundColor: ["#5C9EFF", "#FDCB44", "#FF7B7B"][index] || "#5C9EFF",
                }))
              };
            })()}
            subjectChartData={(() => {
              // Create subject chart data - always return data structure
              const labels = subjectData?.subjectNames || [];
              const levelNames = subjectData?.levelNames || ["Discoverer", "Explorer", "Adventurer"];
              
              return {
                labels: labels,
                datasets: levelNames.map((levelName, index) => ({
                  label: levelName,
                  data: labels.map(subjectName => 
                    subjectData?.subjectData?.[levelName]?.[subjectName] || 0
                  ),
                  backgroundColor: ["#5C9EFF", "#FDCB44", "#FF7B7B"][index] || "#5C9EFF",
                }))
              };
            })()}
            attendanceInsights={renderAttendanceInsights()}
            progressInsights={renderProgressInsights()}
            subjectInsights={renderSubjectInsights()}
          />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
