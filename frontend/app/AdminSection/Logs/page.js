"use client";

import { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes, FaFilter, FaChevronDown, FaChevronUp, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { API } from '@/config/api';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(7);
  const router = useRouter();

  const [availableActions, setAvailableActions] = useState(["All"]);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const actionDropdownRef = useRef(null);

  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    function handleClickOutside(e) {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(e.target)) {
        setIsActionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const sysRes = await fetch(API.logs.getSystemLogs(), { method: "GET" });
        const sysData = await sysRes.json();
        if (!sysData.success) {
          throw new Error(sysData.message || "Failed to fetch system logs");
        }

        const rawLogs = Array.isArray(sysData.logs) ? sysData.logs : [];

        const notificationsPromise = fetch(API.notification.getNotifications())
          .then(r => r.json())
          .catch(() => ({ status: 'error', notifications: [] }));

        const [notificationsData] = await Promise.all([
          notificationsPromise
        ]);

        const actorIds = new Set();
        const targetUserIds = new Set();
        const targetStudentIds = new Set();
        rawLogs.forEach(l => {
          if (l.user_id) actorIds.add(String(l.user_id));
          if (l.target_user_id) targetUserIds.add(String(l.target_user_id));
          if (l.target_student_id) targetStudentIds.add(String(l.target_student_id));
        });

        const allNotifications = (notificationsData && notificationsData.status === 'success' && Array.isArray(notificationsData.notifications))
          ? notificationsData.notifications : [];
        allNotifications.forEach(n => { if (n.created_by) actorIds.add(String(n.created_by)); });

        const meetingNotifications = allNotifications.filter(n =>
          n.notif_message && (/^\[MEETING\]/i.test(n.notif_message) || /^\[ONE ON ONE MEETING\]/i.test(n.notif_message))
        );

        const progressNotifications = allNotifications.filter(n =>
          n.notif_message && (n.notif_message.includes('[QUARTERLY PROGRESS]') || n.notif_message.includes('[OVERALL PROGRESS]'))
        );

        const uniqueUserIds = Array.from(new Set([ ...actorIds, ...targetUserIds ]));
        const uniqueStudentIds = Array.from(targetStudentIds);

        const [userMap, studentMap] = await Promise.all([
          uniqueUserIds.length > 0
            ? fetch(API.user.getUserNames(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ids: uniqueUserIds })
              }).then(r => r.json())
            : Promise.resolve({}),
          uniqueStudentIds.length > 0
            ? fetch(API.user.getStudentNames(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_ids: uniqueStudentIds })
              }).then(r => r.json())
            : Promise.resolve({})
        ]);

        const enrichedSystemLogs = rawLogs.map(l => {
          const actorInfo = l.user_id && userMap[String(l.user_id)] ? userMap[String(l.user_id)] : null;
          const actorName = actorInfo ? actorInfo.full_name : (l.user_id ? `User #${l.user_id}` : "System");

          const actionText = (l.action || '').toLowerCase();
          let entity = "-";
          if (/\bunauthorized\s+login\s+attempt\b/.test(actionText)) {
            entity = 'Security';
          } else if (/\blogin\b|\blogout\b/.test(actionText)) {
            entity = 'Authentication';
          } else if (/changed password/.test(actionText)) {
            entity = 'Security';
          } else if (/archived.*activities|updated.*school.*timeline|updated.*visual.*feedback/i.test(actionText)) {
            entity = 'Configuration';
          } else if (/edited|archived|restored|created/.test(actionText)) {
            entity = 'Account Management';
          } else if (l.target_student_id) {
            entity = 'Account Management';
          } else if (l.target_user_id) {
            entity = 'Account Management';
          }

          // Build human-friendly description sentences
          let description = l.action || '';
          const targetUser = l.target_user_id && userMap[String(l.target_user_id)] ? userMap[String(l.target_user_id)] : null;
          const targetStudentName = l.target_student_id && studentMap[String(l.target_student_id)] ? studentMap[String(l.target_student_id)] : null;

          if (/\bunauthorized\s+login\s+attempt\b/.test(actionText)) {
            // Keep backend message, but ensure consistency
            description = l.action || 'Unauthorized login attempt';
          } else if (/\blogin\b/.test(actionText)) {
            description = `${actorName} login to the system`;
          } else if (/\blogout\b/.test(actionText)) {
            description = `${actorName} logout from the system`;
          } else if (/^changed password$/.test(l.action || '')) {
            description = `${actorName} changed password`;
          } else if (/created/.test(actionText)) {
            if (targetUser) {
              description = `${actorName} created a new ${targetUser.role || 'user'} account named ${targetUser.full_name}`;
            } else if (targetStudentName) {
              description = `${actorName} created a new student profile named ${targetStudentName}`;
            }
          } else if (/archived/.test(actionText)) {
            if (targetUser) {
              description = `${actorName} archived the ${targetUser.role || 'user'} account named ${targetUser.full_name}`;
            } else if (targetStudentName) {
              description = `${actorName} archived the student profile named ${targetStudentName}`;
            }
          } else if (/restored/.test(actionText)) {
            if (targetUser) {
              description = `${actorName} restored the ${targetUser.role || 'user'} account named ${targetUser.full_name}`;
            } else if (targetStudentName) {
              description = `${actorName} restored the student profile named ${targetStudentName}`;
            }
          } else if (/edited/.test(actionText)) {
            if (/their own details/.test(actionText)) {
              description = `${actorName} edited their own details`;
            } else if (targetUser) {
              description = `${actorName} edited the details of the ${targetUser.role || 'user'} account named ${targetUser.full_name}`;
            } else if (targetStudentName) {
              description = `${actorName} edited the details of the student profile named ${targetStudentName}`;
            }
          }

          return {
            id: l.log_id,
            timestamp: l.timestamp,
            description,
            user: actorName,
            actorRole: actorInfo ? actorInfo.role : '',
            entity,
            action: l.action || ""
          };
        });

        const enrichedMeetings = meetingNotifications.map(n => {
          const actorInfo = n.created_by && userMap[String(n.created_by)] ? userMap[String(n.created_by)] : null;
          const actorName = actorInfo ? actorInfo.full_name : (n.created_by ? `User #${n.created_by}` : "System");
          return {
            id: `m-${n.notification_id || n.meeting_id || Math.random()}`,
            timestamp: n.created_at,
            description: n.notif_message || 'Meeting notification',
            user: actorName,
            actorRole: actorInfo ? actorInfo.role : '',
            entity: 'Meeting',
            action: 'Meeting'
          };
        });

        const enrichedProgressCard = progressNotifications.map(n => {
          const actorInfo = n.created_by && userMap[String(n.created_by)] ? userMap[String(n.created_by)] : null;
          const actorName = actorInfo ? actorInfo.full_name : (n.created_by ? `User #${n.created_by}` : "System");
          return {
            id: `pc-${n.notification_id || Math.random()}`,
            timestamp: n.created_at,
            description: n.notif_message || '[QUARTERLY PROGRESS] Update',
            user: actorName,
            actorRole: actorInfo ? actorInfo.role : '',
            entity: 'Academic Progress',
            action: 'Progress'
          };
        });
        const enrichedOverallProgress = [];

        const combined = [
          ...enrichedSystemLogs,
          ...enrichedMeetings,
          ...enrichedProgressCard,
          ...enrichedOverallProgress
        ].filter(x => x && x.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Ensure unique keys by de-duplicating entries that may share ids across sources
        const uniqueMap = new Map();
        combined.forEach(item => {
          const key = `${item.id}|${item.timestamp}`;
          if (!uniqueMap.has(key)) uniqueMap.set(key, item);
        });
        const combinedUnique = Array.from(uniqueMap.values());

        const entities = Array.from(new Set(combinedUnique.map(e => e.entity).filter(Boolean)));
        setAvailableActions(["All", ...entities]);
        setLogs(combinedUnique);
      } catch (e) {
        setError(e.message || "Unexpected error fetching logs");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    const matchesAction = selectedAction === "All" || (l.entity || "").toLowerCase() === selectedAction.toLowerCase();
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      (l.description || "").toLowerCase().includes(term) ||
      (l.user || "").toLowerCase().includes(term) ||
      (l.entity || "").toLowerCase().includes(term);
    return matchesAction && matchesSearch;
  });

  function getSortIcon(field) {
    if (sortField !== field) return <FaSort className="text-xs" />;
    return sortDirection === "asc" ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />;
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "timestamp" ? "desc" : "asc");
    }
    setCurrentPage(1);
  }

  function compareValues(a, b, field) {
    if (field === "timestamp") {
      const da = new Date(a.timestamp).getTime() || 0;
      const db = new Date(b.timestamp).getTime() || 0;
      return da - db;
    }
    const va = (a[field] || "").toString().toLowerCase();
    const vb = (b[field] || "").toString().toLowerCase();
    return va.localeCompare(vb);
  }

  const sorted = [...filtered].sort((a, b) => {
    const order = sortDirection === "asc" ? 1 : -1;
    return order * compareValues(a, b, sortField);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / logsPerPage));
  const current = Math.min(currentPage, totalPages);
  const startIdx = (current - 1) * logsPerPage;
  const paginated = sorted.slice(startIdx, startIdx + logsPerPage);

  function formatTimestamp(ts) {
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? ts : d.toLocaleString();
    } catch {
      return ts;
    }
  }

  return (
    <ProtectedRoute role="Admin">
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e2a79] mb-4"></div>
            <p className="text-lg font-medium">Loading logs...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 text-center px-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-3xl">!</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Logs</h3>
            <p className="text-red-600 mb-2 max-w-md">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with Search and Filter */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search by description, user, or entity"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1e2a79] focus:border-[#1e2a79] transition-colors w-full caret-[#1e2a79]"
                    />
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                      disabled={!searchTerm}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full p-1 transition-colors ${searchTerm ? 'text-[#1e2a79] hover:text-white hover:bg-[#1e2a79] cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                      aria-label="Clear search"
                      title="Clear"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="w-full sm:w-64" ref={actionDropdownRef}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FaFilter className="text-[#1e2a79] text-sm"/>
                      <label className="text-sm font-medium text-[#1e2a79]">Filter</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActionOpen(o => !o)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1e2a79] focus:border-[#1e2a79] bg-white min-w-[120px] w-full sm:w-auto"
                      aria-haspopup="listbox"
                      aria-expanded={isActionOpen}
                    >
                      <span className="truncate">{selectedAction}</span>
                      {isActionOpen ? <FaChevronUp className="text-[#1e2a79]"/> : <FaChevronDown className="text-[#1e2a79]"/>}
                    </button>
                  </div>
                
                  {isActionOpen && (
                    <div className="relative">
                      <ul
                        className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto custom-thin-scroll z-20"
                        role="listbox"
                        tabIndex={-1}
                      >
                        {availableActions.map(act => (
                          <li
                            key={act}
                            role="option"
                            aria-selected={selectedAction === act}
                            onClick={() => { setSelectedAction(act); setCurrentPage(1); setIsActionOpen(false); }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#e6f0ff] ${selectedAction === act ? 'bg-[#f0f4ff] text-[#1e2a79] font-semibold' : 'text-gray-700'}`}
                          >
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-[#1e2a79] text-white border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th onClick={() => handleSort('timestamp')} className="px-6 py-3 font-semibold text-white cursor-pointer select-none">
                      <div className="flex items-center gap-2">Timestamp {getSortIcon('timestamp')}</div>
                    </th>
                    <th onClick={() => handleSort('description')} className="px-6 py-3 font-semibold text-white cursor-pointer select-none">
                      <div className="flex items-center gap-2">Description {getSortIcon('description')}</div>
                    </th>
                    <th onClick={() => handleSort('user')} className="px-6 py-3 font-semibold text-white cursor-pointer select-none">
                      <div className="flex items-center gap-2">User {getSortIcon('user')}</div>
                    </th>
                    <th onClick={() => handleSort('entity')} className="px-6 py-3 font-semibold text-white cursor-pointer select-none">
                      <div className="flex items-center gap-2">Entity {getSortIcon('entity')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10">
                        <div className="flex flex-col justify-center items-center text-center text-gray-600">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">🗒️</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Logs Found</h3>
                          <p className="text-gray-600">Try adjusting your filters or search query.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row, idx) => (
                      <tr key={`${row.id}|${row.timestamp}|${idx}`} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-gray-900">
                          <div className="text-sm">
                            {formatTimestamp(row.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm text-gray-900 truncate max-w-[300px]" title={row.description || '-'}>
                            {row.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-white text-[#1e2a79] border border-gray-200 flex-shrink-0
                              ${(() => {
                                const role = (row.actorRole || '').toLowerCase();
                                if (role.includes('super')) return 'ring-2 ring-green-400'; // Super Admin/Owner
                                if (role.includes('admin') && !role.includes('super')) return 'ring-2 ring-blue-400'; // Admin
                                if (role.includes('teacher')) return 'ring-2 ring-red-400'; // Teacher
                                if (role.includes('parent')) return 'ring-2 ring-yellow-400'; // Parent
                                if (role.includes('student')) return 'ring-2 ring-gray-300'; // Student
                                return 'ring-2 ring-gray-300'; // Fallback
                              })()}`}
                              title={row.actorRole || ''}
                            >
                              {(row.actorRole || '?').charAt(0).toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-900 truncate max-w-[200px]" title={row.user}>
                              {row.user}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm">
                            {row.entity}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {paginated.length > 0 ? startIdx + 1 : 0}-{startIdx + paginated.length} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={current <= 1}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium ${current <= 1 ? 'text-gray-400 border-gray-200' : 'text-[#1e2a79] border-[#1e2a79] hover:bg-[#e6f0ff]'}`}
                  >
                    Prev
                  </button>
                  <span className="px-2 text-sm font-medium">Page {current} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={current >= totalPages}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium ${current >= totalPages ? 'text-gray-400 border-gray-200' : 'text-[#1e2a79] border-[#1e2a79] hover:bg-[#e6f0ff]'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
