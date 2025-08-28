"use client";

import { useState, useEffect } from "react";
import { 
  FaSearch, 
  FaTools,
  FaArchive, 
  FaCalendarAlt, 
  FaStar, 
  FaFilter, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaSchool,
  FaPalette,
  FaHistory,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
  FaDatabase,
  FaTable,
  FaChartBar,
  FaSync,
  FaBook,
  FaUsers,
  FaHeart,
  FaRegStar,
  FaGem,
  FaCaretUp,
  FaCircle,
  FaSave
} from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";

export default function SuperAdminConfigurationPage() {
  // Sample visual feedback data with the specific shapes and colors from the image
  const sampleVisualFeedback = [
    {
      visual_feedback_id: 1,
      visual_feedback_shape: "❤️",
      visual_feedback_name: "Heart",
      visual_feedback_description: "Excellent",
      min_score: 4.200,
      max_score: 5.000,
      shape_type: "heart",
      color: "#e91e63"
    },
    {
      visual_feedback_id: 2,
      visual_feedback_shape: "⭐",
      visual_feedback_name: "Star",
      visual_feedback_description: "Very Good",
      min_score: 3.400,
      max_score: 4.199,
      shape_type: "star",
      color: "#ffc107"
    },
    {
      visual_feedback_id: 3,
      visual_feedback_shape: "💎",
      visual_feedback_name: "Diamond",
      visual_feedback_description: "Good",
      min_score: 2.600,
      max_score: 3.399,
      shape_type: "diamond",
      color: "#2196f3"
    },
         {
       visual_feedback_id: 4,
       visual_feedback_shape: "🔺",
       visual_feedback_name: "Triangle",
       visual_feedback_description: "Need Help",
       min_score: 1.800,
       max_score: 2.599,
       shape_type: "triangle",
       color: "#ff9800"
     },
    {
      visual_feedback_id: 5,
      visual_feedback_shape: "🔴",
      visual_feedback_name: "Circle",
      visual_feedback_description: "Not Met",
      min_score: 1.000,
      max_score: 1.799,
      shape_type: "circle",
      color: "#f44336"
    }
  ];

  const [activeTab, setActiveTab] = useState("Activities");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   
  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    shape: "",
    name: "",
    description: ""
  });
   
  // Real data from database
  const [activities, setActivities] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [advisory, setAdvisory] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [visualFeedback, setVisualFeedback] = useState(sampleVisualFeedback);
  const [tableStructure, setTableStructure] = useState({});

  // Fetch data from database
  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost/capstone-project/backend/Assessment/get_detailed_activity_data.php", {
        method: "GET",
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Backend did not return JSON. First 120 chars: " + text.slice(0, 120));
      }
      
      if (data.success) {
        setActivities(data.data.activities || []);
        setSubjects(data.data.subjects || []);
        setQuarters(data.data.quarters || []);
        setAdvisory(data.data.advisory || []);
        setStatistics(data.data.statistics || {});
        setRecentActivities(data.data.recent_activities || []);
        // Use API data if available, otherwise fall back to sample data
        if (data.data.visual_feedback && data.data.visual_feedback.length > 0) {
          setVisualFeedback(data.data.visual_feedback);
        } else {
          setVisualFeedback(sampleVisualFeedback);
        }
      } else {
        setError(data.message || 'Failed to fetch data');
        // Use sample data if API fails
        setVisualFeedback(sampleVisualFeedback);
      }
    } catch (err) {
      setError('Error connecting to database: ' + err.message);
      // Use sample data if API fails
      setVisualFeedback(sampleVisualFeedback);
    } finally {
      setLoading(false);
    }
  };

  // Fetch table structure
  const fetchTableStructure = async () => {
    try {
      const response = await fetch("http://localhost/capstone-project/backend/Assessment/get_all_activity_tables.php", {
        method: "GET",
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Structure endpoint returned non-JSON:', text.slice(0, 120));
        return;
      }
      
      if (data.success) {
        setTableStructure(data.data);
      }
    } catch (err) {
      console.error('Error fetching table structure:', err);
    }
  };

  // Modal functions
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      shape: item.visual_feedback_shape,
      name: item.visual_feedback_name,
      description: item.visual_feedback_description
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditForm({
      shape: "",
      name: "",
      description: ""
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to update the database
    // For now, we'll just update the local state
    const updatedVisualFeedback = visualFeedback.map(item => 
      item.visual_feedback_id === editingItem.visual_feedback_id 
        ? { ...item, ...editForm }
        : item
    );
    setVisualFeedback(updatedVisualFeedback);
    closeEditModal();
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get shape icon based on shape type
  const getShapeIcon = (shapeType, color) => {
    const iconStyle = { color: color, fontSize: '2rem' };
    
    switch (shapeType) {
      case 'heart':
        return <FaHeart style={iconStyle} />;
      case 'star':
        return <FaRegStar style={iconStyle} />;
      case 'diamond':
        return <FaGem style={iconStyle} />;
      case 'triangle':
        return <FaCaretUp style={iconStyle} />;
      case 'circle':
        return <FaCircle style={iconStyle} />;
      default:
        return <span style={iconStyle}>{editingItem?.visual_feedback_shape}</span>;
    }
  };

  useEffect(() => {
    fetchActivityData();
    fetchTableStructure();
    // Debug: Log the initial visual feedback data
    console.log('Initial visualFeedback:', sampleVisualFeedback);
  }, []);

  // Ensure visualFeedback is always populated
  useEffect(() => {
    if (visualFeedback.length === 0) {
      console.log('Setting visualFeedback to sample data');
      setVisualFeedback(sampleVisualFeedback);
    }
  }, [visualFeedback.length]);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon for a field
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="text-gray-400 text-xs" />;
    }
    return sortDirection === "asc" 
      ? <FaSortUp className="text-blue-600 text-xs" />
      : <FaSortDown className="text-blue-600 text-xs" />;
  };

  // Filter function for search
  const filterData = (data) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.activity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.quarter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.advisory_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredActivities = filterData(activities);
  const filteredQuarters = filterData(quarters);
  const filteredSubjects = filterData(subjects);
  const filteredAdvisory = filterData(advisory);

  return (
    <ProtectedRoute role="Super Admin">
      <div className="flex-1 p-4">
        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="px-5 py-2 border-b border-gray-200">
            <div className="flex gap-2">
              {[
                { name: 'Activities', icon: <FaArchive className="text-sm" /> },
                { name: 'School Year', icon: <FaSchool className="text-sm" /> },
                { name: 'Visual Scoring', icon: <FaPalette className="text-sm" /> },
                { name: 'Subjects', icon: <FaBook className="text-sm" /> },
                { name: 'Advisory Classes', icon: <FaUsers className="text-sm" /> },
                { name: 'Database Tables', icon: <FaDatabase className="text-sm" /> }
              ].map(tab => (
                <button
                  key={tab.name}
                  className={`px-4 py-1.5 rounded-lg font-medium border-2 transition-colors duration-150 flex items-center gap-2 ${
                    activeTab === tab.name 
                      ? 'bg-[#232c67] text-white border-[#232c67]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => setActiveTab(tab.name)}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name, subject, or description"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full caret-[#232c67]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
                  <FaTools className="text-gray-600 text-sm" />
                  <span className="text-sm font-medium text-gray-700">
                    System Configuration
                  </span>
                </div>
                <button
                  onClick={fetchActivityData}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <FaSync className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaTimes className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Visual Scoring' && (
            <>
              {/* Debug: Log the current visualFeedback data */}
              {console.log('Rendering Visual Scoring with data:', visualFeedback)}
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Visual Scoring System Management
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FaPalette className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Total: {visualFeedback.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {visualFeedback.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaPalette className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Scoring System Match Your Search' : 'No Scoring System Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No scoring system found matching "${searchTerm}".`
                      : "There are no scoring systems to display at the moment."
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '20%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-white text-center">Shape</th>
                          <th className="px-6 py-4 font-semibold text-white">Name</th>
                          <th className="px-6 py-4 font-semibold text-white">Description</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Min Score</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Max Score</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="max-h-[272px] overflow-y-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                        <colgroup>
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '25%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '20%' }} />
                        </colgroup>
                        <tbody className="divide-y divide-gray-200">
                          {visualFeedback.map((vf) => (
                            <tr 
                              key={vf.visual_feedback_id} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer group"
                              onClick={() => openEditModal(vf)}
                              title="Click to edit this scoring item"
                            >
                                                             <td className="px-6 py-4 text-center">
                                 <div className="flex justify-center">
                                   {vf.shape_type === 'heart' && <FaHeart style={{ color: vf.color, fontSize: '2rem' }} />}
                                   {vf.shape_type === 'star' && <FaRegStar style={{ color: vf.color, fontSize: '2rem' }} />}
                                   {vf.shape_type === 'diamond' && <FaGem style={{ color: vf.color, fontSize: '2rem' }} />}
                                   {vf.shape_type === 'triangle' && <FaCaretUp style={{ color: vf.color, fontSize: '2rem' }} />}
                                   {vf.shape_type === 'circle' && <FaCircle style={{ color: vf.color, fontSize: '2rem' }} />}
                                   {/* Fallback if no shape type matches */}
                                   {!vf.shape_type && <span style={{ color: vf.color, fontSize: '2rem' }}>{vf.visual_feedback_shape}</span>}
                                 </div>
                               </td>
                              <td className="px-6 py-4">
                                <span className="font-medium text-gray-900">{vf.visual_feedback_name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-600">{vf.visual_feedback_description}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {Number(vf.min_score).toFixed(3)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {Number(vf.max_score).toFixed(3)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading data from database...</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'Activities' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Activities Database Management
                  </h2>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      <FaPlus className="text-xs" />
                      Add Activity
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <FaArchive className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Total: {statistics.total_activities || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCheck className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">Active: {statistics.active_activities || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaTimes className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Archived: {statistics.archived_activities || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredActivities.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaArchive className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Activities Match Your Search' : 'No Activities Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No activities found matching "${searchTerm}".`
                      : "There are no activities to display at the moment."
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("activity_name")}
                          >
                            <div className="flex items-center gap-2">
                              Activity Name
                              {getSortIcon("activity_name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("subject_name")}
                          >
                            <div className="flex items-center gap-2">
                              Subject
                              {getSortIcon("subject_name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("activity_date")}
                          >
                            <div className="flex items-center gap-2">
                              Date
                              {getSortIcon("activity_date")}
                            </div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-white">Quarter</th>
                          <th className="px-6 py-4 font-semibold text-white">Advisory Class</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Status</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Actions</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="max-h-[272px] overflow-y-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                        <colgroup>
                          <col style={{ width: '30%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '10%' }} />
                        </colgroup>
                        <tbody className="divide-y divide-gray-200">
                          {filteredActivities.map((activity) => (
                            <tr key={activity.activity_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-medium text-gray-900">{activity.activity_name}</span>
                                <div className="text-xs text-gray-500 mt-1">#{activity.activity_num}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{activity.subject_name || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-gray-600">{activity.quarter_name || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {activity.advisory_display_name || activity.advisory_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  activity.activity_status === 'Active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {activity.activity_status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Edit Activity"
                                  >
                                    <FaEdit className="text-xs" />
                                  </button>
                                  <button
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Archive Activity"
                                  >
                                    <FaArchive className="text-xs" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'Subjects' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Subjects Management
                  </h2>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      <FaPlus className="text-xs" />
                      Add Subject
                    </button>
                    <div className="flex items-center gap-2">
                      <FaBook className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">Total: {subjects.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredSubjects.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaBook className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Subjects Match Your Search' : 'No Subjects Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No subjects found matching "${searchTerm}".`
                      : "There are no subjects to display at the moment."
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-white">Subject ID</th>
                          <th className="px-6 py-4 font-semibold text-white">Subject Name</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSubjects.map((subject) => (
                          <tr key={subject.subject_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900">{subject.subject_id}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{subject.subject_name}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit Subject">
                                  <FaEdit className="text-xs" />
                                </button>
                                <button className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors" title="Delete Subject">
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'Advisory Classes' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Advisory Classes Management
                  </h2>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                      <FaPlus className="text-xs" />
                      Add Advisory Class
                    </button>
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Total: {advisory.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredAdvisory.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaUsers className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Advisory Classes Match Your Search' : 'No Advisory Classes Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No advisory classes found matching "${searchTerm}".`
                      : "There are no advisory classes to display at the moment."
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-white">Advisory ID</th>
                          <th className="px-6 py-4 font-semibold text-white">Advisory Name</th>
                          <th className="px-6 py-4 font-semibold text-white">Grade Level</th>
                          <th className="px-6 py-4 font-semibold text-white">Section</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAdvisory.map((adv) => (
                          <tr key={adv.advisory_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900">{adv.advisory_id}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{adv.advisory_name}</td>
                            <td className="px-6 py-4 text-gray-600">{adv.grade_level}</td>
                            <td className="px-6 py-4 text-gray-600">{adv.section}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit Advisory Class">
                                  <FaEdit className="text-xs" />
                                </button>
                                <button className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors" title="Delete Advisory Class">
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'Database Tables' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Database Tables Structure
                  </h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={fetchTableStructure}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <FaSync className="text-xs" />
                      Refresh Structure
                    </button>
                    <div className="flex items-center gap-2">
                      <FaDatabase className="text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Tables: {Object.keys(tableStructure).length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {Object.keys(tableStructure).length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaDatabase className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Database Tables Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Database table structure information is not available at the moment.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {Object.entries(tableStructure).map(([tableName, tableInfo]) => (
                    <div key={tableName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FaTable className="text-blue-600" />
                            {tableInfo.display_name} ({tableName})
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Records: {tableInfo.total_records}</span>
                            <span>Columns: {tableInfo.columns?.length || 0}</span>
                            <span>Last Updated: {tableInfo.last_updated}</span>
                          </div>
                        </div>
                      </div>
                      
                      {tableInfo.columns && tableInfo.columns.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Field</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Null</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Key</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Default</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Extra</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {tableInfo.columns.map((column, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{column.field}</td>
                                  <td className="px-4 py-2 text-gray-600 font-mono text-xs">{column.type}</td>
                                  <td className="px-4 py-2 text-gray-600">{column.null}</td>
                                  <td className="px-4 py-2 text-gray-600">{column.key}</td>
                                  <td className="px-4 py-2 text-gray-600">{column.default || '-'}</td>
                                  <td className="px-4 py-2 text-gray-600">{column.extra}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {tableInfo.sample_data && tableInfo.sample_data.length > 0 && (
                        <div className="p-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Sample Data (First 5 rows)</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  {Object.keys(tableInfo.sample_data[0] || {}).map(key => (
                                    <th key={key} className="px-2 py-1 text-left font-medium text-gray-600">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {tableInfo.sample_data.slice(0, 5).map((row, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    {Object.values(row).map((value, colIndex) => (
                                      <td key={colIndex} className="px-2 py-1 text-gray-600">
                                        {typeof value === 'string' && value.length > 20 
                                          ? value.substring(0, 20) + '...' 
                                          : String(value || '')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'School Year' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    School Year Timeline Management
                  </h2>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      <FaPlus className="text-xs" />
                      Add Quarter
                    </button>
                    <div className="flex items-center gap-2">
                      <FaSchool className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">Total: {quarters.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredQuarters.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaSchool className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Quarters Match Your Search' : 'No Quarters Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No quarters found matching "${searchTerm}".`
                      : "There are no quarters to display at the moment."
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("quarter_name")}
                          >
                            <div className="flex items-center gap-2">
                              Quarter Name
                              {getSortIcon("quarter_name")}
                            </div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-white">Start Date</th>
                          <th className="px-6 py-4 font-semibold text-white">End Date</th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredQuarters.map((quarter) => (
                          <tr key={quarter.quarter_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900">{quarter.quarter_name}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {quarter.start_date ? new Date(quarter.start_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {quarter.end_date ? new Date(quarter.end_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Edit Quarter"
                                >
                                  <FaEdit className="text-xs" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Delete Quarter"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}


        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[480px] max-w-[98vw] w-[520px] relative border border-gray-100">
            <div className="mb-4 bg-[#232c67] text-white p-4 rounded-t-lg -mt-8 -mx-8">
              <h3 className="text-xl font-bold text-white mb-1">Edit Scoring Item</h3>
              <p className="text-[#a8b0e0] text-sm">Update the name and description of this scoring item</p>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Shape Preview */}
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Shape</label>
                <div className="flex justify-center mb-2">
                  {getShapeIcon(editingItem?.shape_type, editingItem?.color)}
                </div>
                <p className="text-xs text-gray-500">
                  Shape and color cannot be edited
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors"
                  placeholder="Enter name"
                  required
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors"
                  placeholder="Enter description"
                  required
                />
              </div>

              {/* Score Range Display (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Score Range (Not Editable)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Min Score</span>
                    <div className="text-lg font-mono text-gray-900">
                      {editingItem?.min_score}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Max Score</span>
                    <div className="text-lg font-mono text-gray-900">
                      {editingItem?.max_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <FaTimes className="text-sm" />
                  Close
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#232c67] hover:bg-[#1a1f4d] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <FaSave className="text-sm" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
