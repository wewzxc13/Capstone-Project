"use client";
import React from "react";

const SuperAdminReportExport = ({ 
  attendanceData = null,
  progressData = null,
  subjectData = null,
  attendanceChartData = null,
  progressChartData = null,
  subjectChartData = null,
  attendanceInsights = null,
  progressInsights = null,
  subjectInsights = null
}) => {
  // Helper to format date
  function formatDate(date = new Date()) {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Helper to format numbers with percentage
  function formatPercentage(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return `${value.toFixed(1)}%`;
  }

  // Helper to get current school year
  function getCurrentSchoolYear() {
    const currentYear = new Date().getFullYear();
    return `${currentYear} - ${currentYear + 1}`;
  }


  // Helper to render chart like the actual report page
  function renderReportChart(chartData, title, type) {
    if (!chartData || !chartData.labels || !chartData.datasets || chartData.datasets.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-xl">No {type} data available</div>
        </div>
      );
    }

    const { labels, datasets } = chartData;
    
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{title}</h3>
        
        {/* Legend - positioned above chart */}
        <div className="flex justify-center gap-6 mb-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: dataset.backgroundColor || '#60a5fa' }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{dataset.label}</span>
            </div>
          ))}
        </div>

        {/* Chart container with proper dimensions */}
        <div className="relative" style={{ height: '300px' }}>
          {/* Chart area */}
          <div className="absolute inset-0 flex flex-col justify-end">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-600 w-12">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>
            
            {/* Chart bars */}
            <div className="ml-16 mr-4 mb-8 flex items-end justify-between h-full">
              {labels.map((label, labelIndex) => (
                <div key={labelIndex} className="flex flex-col items-center flex-1 mx-1">
                  {/* Bars for each dataset */}
                  <div className="flex items-end justify-center w-full h-48 relative">
                    {datasets.map((dataset, datasetIndex) => {
                      const value = dataset.data[labelIndex] || 0;
                      const height = (value / 100) * 100; // Percentage of max height
                      const barWidth = 100 / datasets.length; // Equal width for each dataset
                      
                      // Don't render bar if value is 0%
                      if (value === 0) {
                        return null;
                      }
                      
                      return (
                        <div
                          key={datasetIndex}
                          className="absolute bottom-0 rounded-t"
                          style={{
                            height: `${Math.max(height, 2)}%`,
                            width: `${barWidth * 0.8}%`,
                            backgroundColor: dataset.backgroundColor || '#60a5fa',
                            left: `${datasetIndex * barWidth + (barWidth * 0.1)}%`,
                            minHeight: '4px'
                          }}
                          title={`${dataset.label}: ${formatPercentage(value)}`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* X-axis label - positioned below bars */}
                  <div className="mt-2 text-xs text-gray-700 text-center">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to render insights as text with colored level names
  function renderInsightsAsText(insights) {
    if (!insights) {
      return "No insights available for this report.";
    }

    // Color mapping for level names
    const levelColors = {
      'Discoverer': '#60a5fa', // Blue
      'Explorer': '#facc15',   // Yellow  
      'Adventurer': '#f87171'  // Red
    };

    // Convert React elements to text with colored level names
    if (Array.isArray(insights)) {
      return insights.map((item, index) => {
        let text = '';
        if (React.isValidElement(item)) {
          // Extract text content from React elements
          const extractText = (element) => {
            if (typeof element === 'string') return element;
            if (element.props && element.props.children) {
              if (Array.isArray(element.props.children)) {
                return element.props.children.map(extractText).join(' ');
              }
              return extractText(element.props.children);
            }
            return '';
          };
          text = extractText(item);
        } else {
          text = item.toString();
        }

        // Add colors to level names
        Object.keys(levelColors).forEach(levelName => {
          const regex = new RegExp(`\\b${levelName}\\b`, 'g');
          text = text.replace(regex, `<span style="color: ${levelColors[levelName]}; font-weight: bold;">${levelName}</span>`);
        });

        return `${index + 1}. ${text}`;
      }).join('\n\n');
    }

    // Handle single insight string
    let text = insights.toString();
    Object.keys(levelColors).forEach(levelName => {
      const regex = new RegExp(`\\b${levelName}\\b`, 'g');
      text = text.replace(regex, `<span style="color: ${levelColors[levelName]}; font-weight: bold;">${levelName}</span>`);
    });

    return text;
  }

  return (
    <div className="hidden print:block" style={{margin: 0, padding: 0}}>
      {/* Page 1: Attendance Report */}
      <div className="print-page p-6 pastel-blue border-soft rounded-xl text-[15px]" style={{margin: 0}}>
        {/* Simple Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-[60px] h-[60px] rounded-full bg-white/80 border border-white/70 p-2 flex items-center justify-center">
            <img src="/assets/image/villelogo.png" alt="School Logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="ml-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#232c67] leading-tight">LEARNERS' VILLE</div>
            <div className="text-lg text-gray-700">6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines</div>
          </div>
        </div>
        
        <div className="h-0.5 w-full bg-[#232c67] rounded-full mb-4" />

        {/* Attendance Chart */}
        {renderReportChart(attendanceChartData, "Attendance Report", "attendance")}

        {/* Attendance Insights */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Insight Summary</h3>
          <div 
            className="text-base text-gray-800 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: renderInsightsAsText(attendanceInsights) }}
          />
        </div>

        {/* Simple Footer */}
                <div className="text-center mt-4 pt-3 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            Generated on {formatDate()} | School Year {getCurrentSchoolYear()}
          </p>
        </div>
      </div>

      {/* Page 2: Progress Report */}
      <div className="print-page p-6 pastel-green border-soft rounded-xl text-[15px]" style={{margin: 0}}>
        {/* Simple Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-[60px] h-[60px] rounded-full bg-white/80 border border-white/70 p-2 flex items-center justify-center">
            <img src="/assets/image/villelogo.png" alt="School Logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="ml-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#232c67] leading-tight">LEARNERS' VILLE</div>
            <div className="text-lg text-gray-700">6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines</div>
          </div>
        </div>
        
        <div className="h-0.5 w-full bg-[#232c67] rounded-full mb-4" />

        {/* Progress Chart */}
        {renderReportChart(progressChartData, "Progress Report", "progress")}

        {/* Progress Insights */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Insight Summary</h3>
          <div 
            className="text-base text-gray-800 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: renderInsightsAsText(progressInsights) }}
          />
        </div>

        {/* Simple Footer */}
                <div className="text-center mt-4 pt-3 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            Generated on {formatDate()} | School Year {getCurrentSchoolYear()}
          </p>
        </div>
      </div>

      {/* Page 3: Subject Report */}
      <div className="print-page p-6 pastel-yellow border-soft rounded-xl text-[15px]" style={{margin: 0}}>
        {/* Simple Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-[60px] h-[60px] rounded-full bg-white/80 border border-white/70 p-2 flex items-center justify-center">
            <img src="/assets/image/villelogo.png" alt="School Logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="ml-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#232c67] leading-tight">LEARNERS' VILLE</div>
            <div className="text-lg text-gray-700">6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines</div>
          </div>
        </div>
        
        <div className="h-0.5 w-full bg-[#232c67] rounded-full mb-4" />

        {/* Subject Chart */}
        {renderReportChart(subjectChartData, "Subject Report", "subject")}

        {/* Subject Insights */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Insight Summary</h3>
          <div 
            className="text-base text-gray-800 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: renderInsightsAsText(subjectInsights) }}
          />
        </div>

        {/* Simple Footer */}
                <div className="text-center mt-4 pt-3 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            Generated on {formatDate()} | School Year {getCurrentSchoolYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminReportExport;
