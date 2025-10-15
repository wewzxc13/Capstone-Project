"use client";

import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { FaPaperPlane, FaSearch, FaArrowLeft, FaUser, FaUsers, FaTimes, FaEdit, FaTrash, FaCheck, FaUndo, FaEye } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useUser } from "../../Context/UserContext";
import { toast } from "react-toastify";
import { API } from '@/config/api';

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Create a soft pastel background color based on a string (used for sender chips)
function pastelColorFor(seed) {
  let hash = 0;
  const s = String(seed || "seed");
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 90%)`;
}

// Helper function to safely parse JSON responses
async function safeJsonParse(response) {
  // Check if response is OK
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Get response text
  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error('Empty response from server');
  }
  
  // Try to parse JSON
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse JSON:', text);
    throw new Error('Invalid JSON response from server');
  }
}

// Populated from backend
const seededChats = [];

const seededGroupChats = [];

export default function AdminMessagesPage() {
  const router = useRouter();
  const { updateUnreadCounts, getUserPhoto, updateAnyUserPhoto } = useUser();
  const [chats, setChats] = useState(seededChats);
  const [groupChats, setGroupChats] = useState(seededGroupChats);
  const [selectedChatId, setSelectedChatId] = useState(chats[0]?.id || "");
  const [selectedType, setSelectedType] = useState("user"); // 'user' | 'group'
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Users"); // Users | Groups | Archive
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const composerRef = useRef(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [actionMenuForId, setActionMenuForId] = useState(null);
  const [showReadsForId, setShowReadsForId] = useState(null);
  const [readsCache, setReadsCache] = useState({});
  // Temporary selected chat placeholder used when selecting from search
  const [tempSelectedChat, setTempSelectedChat] = useState(null);
  // Track unsent messages in localStorage to persist across page refreshes
  const [unsentMessages, setUnsentMessages] = useState({});
  // Store user photos
  const [userPhotos, setUserPhotos] = useState({});
  // Track which users we've already attempted to fetch photos for
  const photosFetchedRef = useRef(new Set());
  // Track if conversations are being loaded on page refresh
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  // Track if a specific conversation is being loaded
  const [isLoadingSpecificConversation, setIsLoadingSpecificConversation] = useState(false);
  // Track if data has been loaded to prevent multiple API calls
  const dataLoadedRef = useRef({ users: false, groups: false, recent: false });
  
  // Track if effects are currently running to prevent overlapping calls
  const isRunningRef = useRef({ users: false, groups: false, recent: false, conversation: null });
  
  // Reset data loaded flags when component unmounts
  useEffect(() => {
    return () => {
      dataLoadedRef.current = { users: false, groups: false, recent: false };
      isRunningRef.current = { users: false, groups: false, recent: false, conversation: null };
    };
  }, []);

  // Ensure initial state is correct
  useEffect(() => {
    // Reset search focus state on mount to ensure we start showing recent conversations
    setIsSearchFocused(false);
    setQuery("");
  }, []);

  // Map user_role to vibrant color classes
  const roleColorClass = (role) => {
    switch (Number(role)) {
      case 1:
        return "bg-green-600"; // Super Admin/Owner
      case 2:
        return "bg-blue-600"; // Admin
      case 3:
        return "bg-red-600"; // Teacher
      case 4:
        return "bg-yellow-500"; // Parent
      default:
        return "bg-gray-500"; // Fallback
    }
  };

  // Map group_type to vibrant color classes
  const groupTypeColorClass = (groupType) => {
    switch (groupType) {
      case 'Overall':
        return 'bg-purple-500';
      case 'Staff':
        return 'bg-blue-600';
      case 'Class':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get the appropriate class photo based on group_ref_id for class groups
  const getClassPhoto = (groupRefId, groupName) => {
    console.log('getClassPhoto called with groupRefId:', groupRefId, 'groupName:', groupName);
    
    // First try to use group_ref_id if available
    if (groupRefId !== null && groupRefId !== undefined) {
      const refId = Number(groupRefId);
      console.log('getClassPhoto - converted refId:', refId);
      
      if (!isNaN(refId)) {
        switch (refId) {
          case 1:
            console.log('getClassPhoto - returning discoverer photo (by refId)');
            return '/assets/image/discoverer_gc_photo.png';
          case 2:
            console.log('getClassPhoto - returning explorer photo (by refId)');
            return '/assets/image/explorer_gc_photo.png';
          case 3:
            console.log('getClassPhoto - returning adventurer photo (by refId)');
            return '/assets/image/adventurer_gc_photo.png';
        }
      }
    }
    
    // Fallback to name-based detection if groupRefId doesn't work
    console.log('getClassPhoto - falling back to name-based detection for:', groupName);
    const name = (groupName || '').toLowerCase();
    if (name.includes('discoverer')) {
      console.log('getClassPhoto - returning discoverer photo (by name)');
      return '/assets/image/discoverer_gc_photo.png';
    } else if (name.includes('explorer')) {
      console.log('getClassPhoto - returning explorer photo (by name)');
      return '/assets/image/explorer_gc_photo.png';
    } else if (name.includes('adventurer')) {
      console.log('getClassPhoto - returning adventurer photo (by name)');
      return '/assets/image/adventurer_gc_photo.png';
    }
    
    // Final fallback
    console.log('getClassPhoto - returning default explorer photo');
    return '/assets/image/ville.jpg';
  };

  // Get the appropriate group photo based on group type
  const getGroupPhoto = (groupType) => {
    switch ((groupType || '').toLowerCase()) {
      case 'class':
        return '/assets/image/explorer_gc_photo.png';
      case 'overall':
      default:
        return '/assets/image/general_gc_photo.png';
    }
  };

  // Avatar ring highlight color based on role
  const roleAvatarRingClasses = (role) => {
    const r = Number(role);
    if (r === 1) return "ring-2 ring-green-400"; // Super Admin/Owner
    if (r === 2) return "ring-2 ring-blue-400"; // Admin
    if (r === 3) return "ring-2 ring-red-400"; // Teacher
    if (r === 4) return "ring-2 ring-yellow-400"; // Parent
    return "ring-2 ring-gray-400"; // Fallback
  };

  // Avatar background color based on role
  const roleAvatarBgClass = (role) => {
    const r = Number(role);
    if (r === 1) return "bg-green-500"; // Super Admin/Owner
    if (r === 2) return "bg-blue-500"; // Admin
    if (r === 3) return "bg-yellow-500"; // Teacher
    if (r === 4) return "bg-red-500"; // Parent
    return "bg-gray-500"; // Fallback
  };

  // Chip color for sender label in group messages
  const roleChipClasses = (role) => {
    const r = Number(role);
    if (r === 1) return "bg-green-100 text-green-800"; // Super Admin/Owner
    if (r === 2) return "bg-blue-100 text-blue-800"; // Admin
    if (r === 3) return "bg-red-100 text-red-800"; // Teacher
    if (r === 4) return "bg-yellow-100 text-yellow-900"; // Parent
    return "bg-gray-100 text-gray-800"; // Fallback
  };

  // Fetch active users for roles 2,3,4
  useEffect(() => {
    // Prevent multiple calls - but allow reloading if we have insufficient data
    if (dataLoadedRef.current.users && chats.length >= 3 && !isRunningRef.current.users) return;
    
    const controller = new AbortController();
    let isMounted = true;
    isRunningRef.current.users = true; // Mark as running
    
    const loadUsers = async () => {
      try {

        const uid = Number(localStorage.getItem('userId')) || 0;
        if (!uid) {
          console.error('No user ID found in localStorage');
          return;
        }
        

        
        // Use get_users.php for conversation history (default mode)
        const res = await fetch(`${API.communication.getUsers()}?user_id=${uid}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        const data = await safeJsonParse(res);

        
        if (!data?.success) throw new Error(data?.error || "Failed to fetch conversation history");

        const users = (data.data || []).map((u) => {
          const fullName = [u.user_firstname, u.user_middlename, u.user_lastname]
            .filter(Boolean)
            .join(" ");
          

          
          return {
            id: String(u.user_id),
            name: fullName || `User ${u.user_id}`,
            color: roleColorClass(u.user_role),
            role: Number(u.user_role),
            unread: Number(u.unread_count || 0),
            lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
            lastMessage: u.last_message || "",
            isLastUnsent: Boolean(u.is_last_unsent),
            messages: [],
            photo: u.user_photo || null,
          };
        });
        
        // Remove duplicate users by ID to prevent React key conflicts
        const uniqueUsers = users.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
        
        if (isMounted) {
          setChats((prev) => {
            const prevMap = new Map(prev.map(u => [u.id, u]));
            const merged = uniqueUsers.map(u => {
              const existing = prevMap.get(u.id);
              if (existing && Array.isArray(existing.messages) && existing.messages.length > 0) {
                return { ...u, messages: existing.messages, messagesLoaded: existing.messagesLoaded };
              }
              return { ...u, messages: existing?.messages || [], messagesLoaded: existing?.messagesLoaded };
            });
            prev.forEach((p) => { if (!merged.find(m => m.id === p.id)) merged.push(p); });
            return merged;
          });
          dataLoadedRef.current.users = true; // Mark as loaded
          isRunningRef.current.users = false; // Mark as not running
        }
        
        // Initialize photos for all users
        const photos = {};
        uniqueUsers.forEach(user => {
          if (user.photo) {
            photos[user.id] = user.photo;
          }
        });
        
        if (isMounted) setUserPhotos(photos);
        
        // Do not auto-select a chat; show fallback until user clicks a result
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error loading conversation history users:", err);
        }
        if (isMounted) {
          isRunningRef.current.users = false; // Reset running flag on error
        }
      }
    };
    loadUsers();
    return () => { 
      isMounted = false; 
      controller.abort(); 
    };
  }, []); // Only run once on mount

  // Function to load all users for search (called when search is focused)
  const loadAllUsersForSearch = async () => {
    try {
      const uid = Number(localStorage.getItem('userId')) || 0;
      if (!uid) return;
      

      
      // Use get_users.php with search=true parameter to get all active users
      const res = await fetch(`${API.communication.getUsers()}?user_id=${uid}&search=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await safeJsonParse(res);

      
      if (!data?.success) throw new Error(data?.error || "Failed to fetch all users for search");

      const allUsers = (data.data || []).map((u) => {
        const fullName = [u.user_firstname, u.user_middlename, u.user_lastname]
          .filter(Boolean)
          .join(" ");
        return {
          id: String(u.user_id),
          name: fullName || `User ${u.user_id}`,
          color: roleColorClass(u.user_role),
          role: Number(u.user_role),
          unread: 0, // No unread count for search results
          lastMessageAt: null, // No conversation history for search results
          lastMessage: "", // No last message for search results
          messages: [],
          photo: u.user_photo || null,
        };
      });
      
      // Remove duplicate users by ID to prevent React key conflicts
      const uniqueAllUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      

      setChats((prev) => {
        const prevMap = new Map(prev.map(u => [u.id, u]));
        const merged = uniqueAllUsers.map(u => {
          const existing = prevMap.get(u.id);
          if (existing && Array.isArray(existing.messages) && existing.messages.length > 0) {
            return { ...u, messages: existing.messages, messagesLoaded: existing.messagesLoaded };
          }
          return { ...u, messages: existing?.messages || [], messagesLoaded: existing?.messagesLoaded };
        });
        prev.forEach((p) => { if (!merged.find(m => m.id === p.id)) merged.push(p); });
        return merged;
      });
      
      // Update photos for new users
      const newPhotos = {};
      uniqueAllUsers.forEach(user => {
        if (user.photo) {
          newPhotos[user.id] = user.photo;
        }
      });
      setUserPhotos(prev => ({ ...prev, ...newPhotos }));
      
    } catch (err) {
      console.error("Error loading all users for search:", err);
    }
  };

  // Function to restore conversation history (called when search is unfocused)
  const restoreConversationHistory = async () => {
    try {
      const uid = Number(localStorage.getItem('userId')) || 0;
      if (!uid) return;
      
     
      
      // Use get_users.php for conversation history (default mode)
      const res = await fetch(`${API.communication.getUsers()}?user_id=${uid}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await safeJsonParse(res);

      
      if (!data?.success) throw new Error(data?.error || "Failed to restore conversation history");

      const users = (data.data || []).map((u) => {
        const fullName = [u.user_firstname, u.user_middlename, u.user_lastname]
          .filter(Boolean)
          .join(" ");
        

        
        return {
          id: String(u.user_id),
          name: fullName || `User ${u.user_id}`,
          color: roleColorClass(u.user_role),
          role: Number(u.user_role),
          unread: Number(u.unread_count || 0),
          lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
          lastMessage: u.last_message || "",
          isLastUnsent: Boolean(u.is_last_unsent),
          messages: [],
          photo: u.user_photo || null,
        };
      });
      
      // Remove duplicate users by ID to prevent React key conflicts
      const uniqueUsers = users.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      

      setChats(uniqueUsers);
      
    } catch (err) {
      console.error("Error restoring conversation history:", err);
    }
  };

  // Function to check if a user has conversation history
  const checkUserConversationHistory = async (userId) => {
    try {
      const uid = Number(localStorage.getItem('userId')) || 0;
      if (!uid) return false;
      

      
      // Check if this user has any conversation history
      const res = await fetch(`${API.communication.getConversation()}?user_id=${uid}&partner_id=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await safeJsonParse(res);
      
              if (data?.success && data.data && data.data.length > 0) {
          return true;
        } else {
          return false;
        }
    } catch (err) {
      console.error("Error checking conversation history for user:", userId, err);
      return false;
    }
  };

  // Function to remove duplicate users from chats array
  const removeDuplicateUsers = (chatsArray) => {
    const seen = new Set();
    const unique = [];
    
    for (const chat of chatsArray) {
      if (!seen.has(chat.id)) {
        seen.add(chat.id);
        unique.push(chat);
      } else {

      }
    }
    
    return unique;
  };

  // Enhanced setChats function that automatically removes duplicates
  const setChatsWithDuplicateRemoval = (newChats) => {
    const uniqueChats = removeDuplicateUsers(newChats);

    setChats(uniqueChats);
  };

  // Function to mark messages as read for a user
  const markMessagesAsRead = async (userId) => {
    try {
      const uid = Number(localStorage.getItem('userId'));
      if (!uid) return;
      

      
      // Call the backend to mark messages as read
      const res = await fetch(API.communication.markMessagesRead(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: uid, 
          partner_id: userId 
        }),
      });
      
      const data = await safeJsonParse(res);
              if (data?.success) {
        
        // Refresh unread counts by calling the get_users API again
        try {
          const uid = Number(localStorage.getItem('userId'));
          const refreshRes = await fetch(`${API.communication.getUsers()}?user_id=${uid}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          
          const refreshData = await safeJsonParse(refreshRes);
          if (refreshData?.success && refreshData.data) {
            // Update the unread counts in both chats and recent arrays
            setChats((prev) => {
              return prev.map((c) => {
                const updatedUser = refreshData.data.find(u => String(u.user_id) === c.id);
                if (updatedUser) {
                  return { ...c, unread: Number(updatedUser.unread_count || 0) };
                }
                return c;
              });
            });
            
            setRecent((prev) => {
              return prev.map((r) => {
                const updatedUser = refreshData.data.find(u => String(u.user_id) === r.id);
                if (updatedUser) {
                  return { ...r, unread: Number(updatedUser.unread_count || 0) };
                }
                return r;
              });
            });
          }
        } catch (refreshErr) {
          console.error('Error refreshing unread counts:', refreshErr);
        }
      }
    } catch (err) {
      console.error('Error marking messages as read for user:', userId, err);
    }
  };

  // Function to manually load conversation for a user
  const manuallyLoadConversation = async (userId) => {
    try {
      const uid = Number(localStorage.getItem('userId'));
      if (!uid) return;
      

      
      // Set loading state
      setIsLoadingSpecificConversation(true);
      
      // Mark as running to prevent conflicts
      isRunningRef.current.conversation = userId;
      
      const res = await fetch(`${API.communication.getConversation()}?user_id=${uid}&partner_id=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await safeJsonParse(res);
      
      if (data?.success && data.data && data.data.length > 0) {
        const msgs = data.data.map((m) => ({
          id: String(m.message_id),
          from: Number(m.sender_id) === uid ? 'self' : 'other',
          text: m.is_unsent == 1 ? '' : (m.is_edited == 1 && m.message_text.startsWith('edited ')) ? m.message_text.substring(7) : m.message_text,
          isUnsent: m.is_unsent == 1,
          edited: m.is_edited == 1,
          isRead: m.is_read == 1,
          time: m.sent_at ? new Date(m.sent_at) : new Date(),
        }));
        

        
        // Update the chats array with messages for this user
        setChats((prev) => {
          const updated = prev.map((c) => 
            c.id === userId ? { ...c, messages: msgs, unread: 0 } : c
          );

          return updated;
        });
        
        // Also update the recent array if this user exists there
        setRecent((prev) => {
          const updated = prev.map((r) => 
            r.id === userId ? { ...r, messages: msgs, unread: 0 } : r
          );
          return updated;
        });
        

        
        // Mark messages as read for this user
        await markMessagesAsRead(userId);
        
        // Add a small delay to ensure state updates are processed
        // This helps ensure the conversation is displayed in the right panel

      } else {

      }
      
      // Mark as not running
      isRunningRef.current.conversation = null;
      setIsLoadingSpecificConversation(false);
    } catch (err) {
      console.error('Error manually loading conversation for user:', userId, err);
      isRunningRef.current.conversation = null;
      setIsLoadingSpecificConversation(false);
    }
  };

  // Fetch available groups from backend
  useEffect(() => {
    console.log('Groups useEffect triggered');
    console.log('Groups useEffect - dataLoadedRef.current.groups:', dataLoadedRef.current.groups);
    console.log('Groups useEffect - groupChats.length:', groupChats.length);
    console.log('Groups useEffect - isRunningRef.current.groups:', isRunningRef.current.groups);
    
    // Prevent multiple calls - simplified guard
    if (dataLoadedRef.current.groups || groupChats.length > 0 || isRunningRef.current.groups) {
      console.log('Groups useEffect - guard triggered, returning early');
      return;
    }
    
    console.log('Groups useEffect - proceeding to load groups');
    const controller = new AbortController();
    let isMounted = true;
    isRunningRef.current.groups = true; // Mark as running
    
    const loadGroups = async () => {
      try {
        console.log('loadGroups function called');
        const uid = Number(localStorage.getItem('userId')) || 0;
        console.log('loadGroups - user ID from localStorage:', uid);
        
        // Add user_id as query parameter
        const url = `${API.communication.getGroups()}?user_id=${uid}`;
        console.log('loadGroups - API URL:', url);
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        // Use helper function for safe JSON parsing
        const json = await safeJsonParse(res);
        console.log('Groups API response:', json);
        if (!json?.success) throw new Error(json?.error || 'Failed to fetch groups');
        const mapped = (json.data || []).map((g) => ({
          id: String(g.group_id),
          name: g.group_name,
          type: 'group',
          color: groupTypeColorClass(g.group_type),
          participantsLabel: g.participants_label || '',
          unread: Number(g.unread_count || 0),
          lastMessageAt: g.last_sent_at ? new Date(g.last_sent_at) : null,
          lastMessage: (() => {
            const isOwn = Number(g.last_sender_id || 0) === (Number(localStorage.getItem('userId')) || 0);
            if (isOwn) return g.last_message || '';
            const role = Number(g.last_sender_role || 0);
            const roleName = role === 1 ? 'Owner' : role === 2 ? 'Admin' : role === 3 ? 'Teacher' : role === 4 ? 'Parent' : 'User';
            const name = g.last_sender_name || 'Member';
            const msg = g.last_message || '';
            return `[${roleName}] ${name}: ${msg}`;
          })(),
          messages: [],
          groupType: g.group_type,
          groupRefId: g.group_ref_id, // Add this field to access group_ref_id
        }));
        if (isMounted) {
          console.log('Setting groupChats state with groups:', mapped);
          console.log('Groups count:', mapped.length);
          setGroupChats(mapped);
          dataLoadedRef.current.groups = true; // Mark as loaded
          isRunningRef.current.groups = false; // Mark as not running
          console.log('Groups loaded successfully, groupChats state updated');
          console.log('Current groupChats state after setState:', mapped);
          
          // Fetch user photos for all group members
          fetchUserPhotosForGroupMembers(mapped);
        }
        
        // For users mentioned in group messages, mark them as processed
        const groupMessageUsers = mapped
          .filter(group => group.last_sender_id && !photosFetchedRef.current.has(group.last_sender_id))
          .map(group => group.last_sender_id);
        
        if (groupMessageUsers.length > 0) {
          // Mark these users as processed so we don't try to fetch photos for them again
          groupMessageUsers.forEach(uid => photosFetchedRef.current.add(uid));
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('Error loading groups:', err);
        if (isMounted) {
          isRunningRef.current.groups = false; // Reset running flag on error
        }
      }
    };
    loadGroups();
    return () => { isMounted = false; if (!controller.signal.aborted) controller.abort(); };
  }, []); // Run once on mount - independent of users loading

  // Fetch recent conversations for the logged in user to display in the left when not searching
  const [recent, setRecent] = useState([]);
  const [archived, setArchived] = useState([]);
  useEffect(() => {
    // Prevent multiple calls - use a more aggressive check
    if (dataLoadedRef.current.recent || recent.length > 0 || isRunningRef.current.recent ||
        !dataLoadedRef.current.users) return; // Wait for users to load first
    
    const uid = Number(localStorage.getItem("userId"));
    if (!uid) return;
    const controller = new AbortController();
    let isMounted = true;
    isRunningRef.current.recent = true; // Mark as running
    

    
    fetch(API.communication.getRecentConversations(), {
      signal: controller.signal,
    })
      .then((r) => safeJsonParse(r))
      .then(async (json) => {

        if (!json?.success) {
          console.error('Recent conversations API returned success: false');
          return;
        }
        const mapped = (json.data || []).map((u) => {
          const name = [u.user_firstname, u.user_middlename, u.user_lastname].filter(Boolean).join(" ");
          const rawLast = u.last_message || "";
          const fromSelf = Number(u.last_sender_id || 0) === uid;
          const userId = String(u.user_id);
          
          // Check if this conversation has unsent messages in localStorage
          const hasUnsentMessages = unsentMessages[userId] && unsentMessages[userId].length > 0;
          
          // Improved detection of unsent messages - check for various possible formats
          const isUnsentText = typeof rawLast === 'string' && (
            rawLast.toLowerCase().includes('unsent a message') ||
            rawLast.toLowerCase().includes('unsent') ||
            rawLast.toLowerCase().includes('message unsent') ||
            rawLast === '' || // Empty message might indicate unsent
            rawLast.trim() === ''
          );
          
          // Improved logic for unsent messages
          let normalizedLast;
          if (isUnsentText || hasUnsentMessages) {
            // If the message indicates it was unsent and it's from self, show "You unsent a message"
            normalizedLast = fromSelf ? 'You unsent a message' : `${name} unsent a message`;
          } else if (fromSelf && rawLast) {
            // If it's from self and has content, show "You: [message]"
            normalizedLast = `You: ${rawLast}`;
          } else {
            // Otherwise show the raw message
            normalizedLast = rawLast;
          }
          
          return {
            id: userId,
            name: name,
            color: roleColorClass(u.user_role),
            role: Number(u.user_role),
            unread: Number(u.unread_count || 0),
            lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
            lastMessage: normalizedLast,
            messages: [],
            photo: u.user_photo || null, // Photo is now included in the API response
          };
        });
        
        if (isMounted) {
          setRecent(mapped);
          dataLoadedRef.current.recent = true; // Mark as loaded
          isRunningRef.current.recent = false; // Mark as not running
          
          // Store photos in UserContext for global access
          (json.data || []).forEach((u) => {
            const userId = String(u.user_id);
            if (u.user_photo) {
              updateAnyUserPhoto(userId, u.user_photo);
              setUserPhotos(prev => ({ ...prev, [userId]: u.user_photo }));
              photosFetchedRef.current.add(userId);
            }
          });
        }
        

      })
      .catch((err) => { 
        if (err.name !== 'AbortError') {
          console.error("Error loading recent conversations:", err);
          console.error("Error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack
          });
        }
        if (isMounted) {
          isRunningRef.current.recent = false; // Reset running flag on error
        }
      })
    return () => { 
      isMounted = false; 
      controller.abort(); 
    };
  }, []); // Only run once on mount - remove userPhotos dependency

  // Handle unsent messages updates separately to avoid infinite loops
  useEffect(() => {
    if (!recent.length) return; // Only run after recent conversations are loaded
    
    const uid = Number(localStorage.getItem("userId"));
    if (!uid) return;
    
    // Only update if there are actual changes to avoid infinite loops
    const hasChanges = recent.some(chat => {
      const hasUnsentMessages = unsentMessages[chat.id] && unsentMessages[chat.id].length > 0;
      return hasUnsentMessages && chat.lastMessage !== 'You unsent a message';
    });
    
    if (hasChanges) {
      setRecent(prev => prev.map(chat => {
        const hasUnsentMessages = unsentMessages[chat.id] && unsentMessages[chat.id].length > 0;
        if (hasUnsentMessages && chat.lastMessage !== 'You unsent a message') {
          return { ...chat, lastMessage: 'You unsent a message' };
        }
        return chat;
      }));
    }
  }, [unsentMessages, recent.length]); // Only depend on unsentMessages changes and recent length

  // Aggregate unread totals for tabs
  const usersUnreadTotal = useMemo(() => {
    try {
      return (recent || []).reduce((sum, r) => sum + (Number(r.unread) || 0), 0);
    } catch {
      return 0;
    }
  }, [recent]);

  const groupsUnreadTotal = useMemo(() => {
    try {
      return (groupChats || []).reduce((sum, g) => sum + (Number(g.unread) || 0), 0);
    } catch {
      return 0;
    }
  }, [groupChats]);

  // Intentionally no fallback to all users; only real recent conversations will appear

  // Update global unread counts whenever they change
  useEffect(() => {
    updateUnreadCounts({
      users: usersUnreadTotal,
      groups: groupsUnreadTotal
    });
  }, [usersUnreadTotal, groupsUnreadTotal, updateUnreadCounts]);

  // Remove the immediate refresh on mount to prevent infinite loops
  // The unread counts will be updated automatically when the calculated values change

  // Ensure archive tab is kept in sync when tab becomes active
  useEffect(() => {
    if (activeTab !== 'Archive') return;
    console.log('Archive tab activated, loading archived conversations...');
    const uid = Number(localStorage.getItem("userId"));
    if (!uid) return;
    let isMounted = true;
    fetch(`${API.communication.getArchivedConversations()}?user_id=${uid}`)
      .then((r) => safeJsonParse(r))
      .then(async (json) => {
        if (!json?.success) return;
        console.log('Archive API response:', json);
        const mapped = (json.data || []).map((u) => {
          const name = [u.user_firstname, u.user_middlename, u.user_lastname].filter(Boolean).join(" ");
          return {
            id: String(u.user_id),
            name,
            color: roleColorClass(u.user_role),
            role: Number(u.user_role),
            unread: 0,
            lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
            messages: [],
            archived: true,
            photo: u.user_photo || null, // Photo now comes from API with proper URL
          };
        });
        console.log('Archive - mapped users:', mapped);
        if (isMounted) {
          setArchived(mapped);
          
          // Store photos in UserContext for global access
          mapped.forEach(user => {
            if (user.photo) {
              updateAnyUserPhoto(user.id, user.photo);
              setUserPhotos(prev => ({ ...prev, [user.id]: user.photo }));
            }
          });
        }
        

      })
      .catch((err) => { 
        if (err.name !== 'AbortError') {
          console.error("Error loading archived conversations:", err);
        }
      });
    return () => { 
      isMounted = false; 
    };
  }, [activeTab]); // Only run when activeTab changes to prevent infinite loops



  const filteredUsers = useMemo(() => {
    console.log('filteredUsers useMemo - chats state:', chats);
    const q = query.trim().toLowerCase();
    const base = chats || [];
    if (!q) return base;
    
    // When searching, filter from all available users
    return base.filter((c) => c.name.toLowerCase().includes(q));
  }, [chats, query]);

  const filteredGroups = useMemo(() => {
    console.log('filteredGroups useMemo - groupChats state:', groupChats);
    console.log('filteredGroups useMemo - groupChats length:', groupChats.length);
    const q = query.trim().toLowerCase();
    if (!q) return groupChats;
    // Filter groups by name (shows groups based on user role access)
    const filtered = groupChats.filter((g) => g.name.toLowerCase().includes(q));
    console.log('filteredGroups useMemo - filtered result:', filtered);
    return filtered;
  }, [groupChats, query]);

  const selectedChat = useMemo(() => {
    if (selectedType === "group") {
      const result = groupChats.find((g) => g.id === selectedChatId) || null;
      return result;
    }
    if (selectedType === 'archived') {
      const result = archived.find((a) => a.id === selectedChatId) || null;
      return result;
    }
    
    // For user chats, also check recent array to ensure we get the most up-to-date data
    let result = chats.find((c) => c.id === selectedChatId) || null;
    if (!result && selectedType === 'user') {
      result = recent.find((r) => r.id === selectedChatId) || null;
    }
    
    // If still not found (e.g., selected from search before arrays update), use temporary placeholder
    if (!result && tempSelectedChat && tempSelectedChat.id === selectedChatId) {
      return tempSelectedChat;
    }
    
    return result;
  }, [selectedType, selectedChatId, chats, groupChats, archived, recent, tempSelectedChat]);

  // Component mount effect - now handled by loadConversationHistoryWithMessages
  useEffect(() => {
    // Component mounted, conversation history loading will happen automatically
  }, []); // Only run on mount

  // Enhanced conversation history loading that also fetches messages
  useEffect(() => {
    const loadConversationHistoryWithMessages = async () => {
      try {
        const uid = Number(localStorage.getItem('userId')) || 0;
        if (!uid) return;
        

        setIsLoadingConversations(true);
        
        // First, load the user list
        const res = await fetch(`${API.communication.getUsers()}?user_id=${uid}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        const data = await safeJsonParse(res);
        
        if (data?.success && data.data && data.data.length > 0) {
          const users = data.data.map((u) => {
            const fullName = [u.user_firstname, u.user_middlename, u.user_lastname]
              .filter(Boolean)
              .join(" ");
            
            return {
              id: String(u.user_id),
              name: fullName,
              color: roleColorClass(u.user_role),
              role: u.user_role,
              unread: u.unread_count || 0,
              lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
              lastMessage: u.last_message || "",
              messages: [],
              photo: u.user_photo,
              isLastUnsent: Boolean(u.is_last_unsent),
            };
          });
          
          // Set the users first, preserving any loaded messages
          setChats((prev) => {
            const prevMap = new Map(prev.map(u => [u.id, u]));
            const merged = users.map(u => {
              const existing = prevMap.get(u.id);
              if (existing && Array.isArray(existing.messages) && existing.messages.length > 0) {
                return { ...u, messages: existing.messages, messagesLoaded: existing.messagesLoaded };
              }
              return { ...u, messages: existing?.messages || [], messagesLoaded: existing?.messagesLoaded };
            });
            prev.forEach((p) => { if (!merged.find(m => m.id === p.id)) merged.push(p); });
            return merged;
          });
          setRecent((prev) => (prev && prev.length ? prev : users));
          dataLoadedRef.current.users = true;
          
          // Don't automatically load messages here - let the user selection trigger it
          // This prevents conflicts and ensures proper conversation loading
        }
      } catch (err) {
        console.error('Error loading conversation history:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    loadConversationHistoryWithMessages();
  }, []); // Only run on mount

  // Cleanup effect to abort any ongoing requests
  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      if (isRunningRef.current.controller && !isRunningRef.current.controller.signal.aborted) {
        isRunningRef.current.controller.abort();
      }
      isRunningRef.current.conversation = null;
      isRunningRef.current.controller = null;
    };
  }, []);

  // Load conversation when a user is selected (fallback for automatic loading)
  useEffect(() => {
    if (!selectedChatId || selectedType !== 'user') {
      return;
    }
    
    const uid = Number(localStorage.getItem('userId'));
    if (!uid) {
      return;
    }
    
    // Prevent multiple simultaneous conversation loads for the same user
    if (isRunningRef.current.conversation === selectedChatId) {
      return;
    }
    
    // Check if this user already has messages loaded (to prevent reloading)
    const userWithMessages = chats.find(c => c.id === selectedChatId && c.messages && c.messages.length > 0);
    if (userWithMessages) {
      return;
    }
    
    // Check if this user exists in the chats array (to ensure we can load their conversation)
    const userExists = chats.find(c => c.id === selectedChatId);
    if (!userExists) {
      return;
    }
    
    // Only auto-load if manual loading hasn't been triggered
    // This prevents conflicts with the manual loading from click handlers
    if (isRunningRef.current.conversation) {
      return;
    }
    
    // Also check if this user was just manually loaded to prevent conflicts
    const userJustManuallyLoaded = chats.find(c => c.id === selectedChatId && c.messages && c.messages.length > 0);
    if (userJustManuallyLoaded) {
      return;
    }
    
    // Mark as running
    isRunningRef.current.conversation = selectedChatId;
    
    const controller = new AbortController();
    
    // Store the controller reference to allow cancellation
    isRunningRef.current.controller = controller;
    
    fetch(`${API.communication.getConversation()}?user_id=${uid}&partner_id=${selectedChatId}`, {
      signal: controller.signal,
    })
      .then((r) => safeJsonParse(r))
      .then((json) => {
        if (!json?.success) {
          console.error('Failed to load conversation for user:', selectedChatId);
          return;
        }
        
        const msgs = (json.data || []).map((m) => ({
          id: String(m.message_id),
          from: Number(m.sender_id) === uid ? 'self' : 'other',
          text: m.is_unsent == 1 ? '' : m.message_text,
          isUnsent: m.is_unsent == 1,
          edited: m.is_edited == 1,
          isRead: m.is_read == 1,
          time: m.sent_at ? new Date(m.sent_at) : new Date(),
        }));
        
        // Update ONLY the messages for this specific user, preserve all other users
        setChats((prev) => {
          const updated = prev.map((c) => 
            c.id === selectedChatId ? { ...c, messages: msgs, unread: 0 } : c
          );
          return updated;
        });
        // Keep tempSelectedChat; it will be ignored once real data is present
        
        // Clean up any duplicates that might have been created
        setTimeout(() => {
          setChats(prev => removeDuplicateUsers(prev));
        }, 100);
        
        // Also update the recent array if this user exists there
        setRecent((prev) => {
          const updated = prev.map((r) => 
            r.id === selectedChatId ? { ...r, messages: msgs, unread: 0 } : r
          );
          return updated;
        });
        
        // Mark messages as read for this user
        markMessagesAsRead(selectedChatId);
      })
      .catch((err) => { 
        if (!(err && err.name === 'AbortError')) {
          console.error('Error auto-loading conversation for user:', selectedChatId, err);
        }
      })
      .finally(() => {
        // Mark as not running
        isRunningRef.current.conversation = null;
      });
      
    return () => { 
      // Abort any ongoing request
      if (isRunningRef.current.controller && !isRunningRef.current.controller.signal.aborted) {
        isRunningRef.current.controller.abort();
      }
      // Mark as not running if component unmounts
      isRunningRef.current.conversation = null;
      isRunningRef.current.controller = null;
    };
  }, [selectedChatId, selectedType]); // Removed chats and recent to prevent infinite loops

  // Load group conversation when a group is selected
  useEffect(() => {
    if (!selectedChat || selectedType !== 'group') return;
    const uid = Number(localStorage.getItem('userId'));
    if (!uid) return;
    const controller = new AbortController();
    fetch(`${API.communication.getGroupMessages()}?group_id=${selectedChat.id}&user_id=${uid}`, {
      signal: controller.signal,
    })
      .then((r) => safeJsonParse(r))
      .then((json) => {
        if (!json?.success) return;
        const msgs = (json.data || []).map((m) => ({
          id: String(m.group_message_id),
          from: Number(m.sender_id) === uid ? 'self' : 'other',
          senderId: String(m.sender_id),
          senderRole: Number(m.sender_role),
          senderName: (() => {
            const roleId = Number(m.sender_role);
            const role = roleId === 1 ? 'Owner' : roleId === 2 ? 'Admin' : roleId === 3 ? 'Teacher' : roleId === 4 ? 'Parent' : 'User';
            const name = m.sender_name || 'Member';
            return `[${role}] ${name}`;
          })(),
          text: m.is_unsent == 1 ? '' : m.message_text,
          isUnsent: m.is_unsent == 1,
          edited: m.is_edited == 1,
          time: m.sent_at ? new Date(m.sent_at) : new Date(),
        }));
        setGroupChats((prev) => prev.map((g) => (g.id === selectedChat.id ? { ...g, messages: msgs, unread: 0 } : g)));
        
        // Fetch user photos for all message senders
        fetchUserPhotosForGroupMessages(msgs);
      })
      .catch((err) => { if (!(err && err.name === 'AbortError')) { /* ignore */ } });
    return () => { if (!controller.signal.aborted) controller.abort(); };
  }, [selectedChat?.id, selectedType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatId, chats]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedChat) return;
    const uid = Number(localStorage.getItem('userId'));
    if (!uid) return;
    const now = new Date();
    if (selectedType === "group") {
      // Optimistic UI update
      const optimisticId = `${selectedChat.id}-${Date.now()}`;
      setGroupChats((prev) =>
        prev.map((g) =>
          g.id === selectedChat.id
            ? {
              ...g,
              messages: [
                ...g.messages,
                { id: optimisticId, from: "self", senderId: String(uid), senderName: "You", text, time: now },
              ],
              lastMessage: `You: ${text}`,
              lastMessageAt: now,
              unread: 0,
            }
            : g
        )
      );

      // Persist to backend
      try {
        const senderId = Number(localStorage.getItem('userId'));
        const groupId = Number(selectedChat.id);
        fetch(API.communication.sendGroupMessage(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: groupId, sender_id: senderId, message_text: text }),
        })
          .then((r) => safeJsonParse(r))
          .then((res) => {
            if (!res?.success) throw new Error(res?.error || 'Failed to send group message');
            const sentAt = res.data?.sent_at ? new Date(res.data.sent_at) : now;
            const assignedId = String(res.data?.group_message_id || optimisticId);
            setGroupChats((prev) =>
              prev.map((g) =>
                g.id === String(groupId)
                  ? {
                    ...g,
                    lastMessageAt: sentAt,
                    messages: g.messages.map((m) => (m.id === optimisticId ? { ...m, id: assignedId, time: sentAt } : m)),
                  }
                  : g
              )
            );
          })
          .catch((err) => {
            console.error('Failed to persist group message:', err);
          });
      } catch (err) {
        console.error('Send group message error:', err);
      }
    } else {
      // Optimistic UI update for individual chat
      const optimisticId = `tmp-${Date.now()}`;
      
      // Update ONLY the selected chat in chats array, preserve all other users
      setChats((prev) => {
        // Ensure we don't lose the main conversation list
        const safePrev = Array.isArray(prev) ? prev : [];
        const exists = safePrev.some((c) => c.id === selectedChat.id);
        if (!exists) {
          const newUser = {
            id: selectedChat.id,
            name: selectedChat.name,
            color: selectedChat.color,
            role: selectedChat.role,
            unread: 0,
            lastMessageAt: now,
            lastMessage: `You: ${text}`,
            messages: [{ id: optimisticId, from: 'self', text, time: now }],
            photo: selectedChat.photo || null,
          };
          return [...safePrev, newUser];
        }
        
        const updated = safePrev.map((c) =>
          c.id === selectedChat.id
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: optimisticId, from: 'self', text, time: now },
                ],
                lastMessage: `You: ${text}`,
                lastMessageAt: now,
                unread: 0,
              }
            : c
        );

        return updated;
      });
      // If we were showing a temporary selected chat from search, clear it now
      setTempSelectedChat((prev) => (prev && prev.id === selectedChat.id ? null : prev));
      
      // Clean up any duplicates that might have been created
      setTimeout(() => {
        setChats(prev => removeDuplicateUsers(prev));
      }, 100);

      // Update Recent list for this specific user
      setRecent((prev) => {
        const exists = prev.find((r) => r.id === selectedChat.id);
        const updatedItem = {
          id: selectedChat.id,
          name: selectedChat.name,
          color: selectedChat.color,
          role: selectedChat.role,
          unread: 0,
          lastMessageAt: now,
          lastMessage: `You: ${text}`,
          messages: [],
        };
        if (exists) {
          const others = prev.filter((r) => r.id !== selectedChat.id);
          return [updatedItem, ...others];
        }
        return [updatedItem, ...prev];
      });

      // Clear unsent messages for this user since we're sending a new message
      clearUnsentMessages(selectedChat.id);

      // Persist to backend
      try {
        const senderId = Number(localStorage.getItem("userId"));
        const receiverId = Number(selectedChat.id);
        fetch(API.communication.sendMessage(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender_id: senderId, receiver_id: receiverId, message_text: text }),
        })
          .then((r) => safeJsonParse(r))
          .then((res) => {
            if (!res?.success) throw new Error(res?.error || "Failed to send message");
            // Optionally update sent_at with authoritative time
            const sentAt = res.data?.sent_at ? new Date(res.data.sent_at) : now;
            const dbId = String(res.data?.message_id || "");
            
            // Update ONLY the selected chat in chats array, preserve all other users
            setChats((prev) => {
              const safePrev = Array.isArray(prev) ? prev : [];
              const exists = safePrev.some((c) => c.id === String(receiverId));
              if (!exists) {
                const newUser = {
                  id: String(receiverId),
                  name: selectedChat.name,
                  color: selectedChat.color,
                  role: selectedChat.role,
                  unread: 0,
                  lastMessageAt: sentAt,
                  lastMessage: `You: ${text}`,
                  messages: [{ id: dbId || optimisticId, from: 'self', text, time: sentAt }],
                  photo: selectedChat.photo || null,
                };
                return [...safePrev, newUser];
              }
              
              const updated = safePrev.map((c) =>
                c.id === String(receiverId)
                  ? { 
                      ...c, 
                      lastMessageAt: sentAt, 
                      messages: c.messages.map((m) => 
                        (m.id === optimisticId && dbId ? { ...m, id: dbId, time: sentAt } : m)
                      ) 
                    }
                  : c
              );
      
              return updated;
            });
            // Ensure temporary placeholder is cleared after confirmed send
            setTempSelectedChat((prev) => (prev && prev.id === String(receiverId) ? null : prev));
            
            // Clean up any duplicates that might have been created
            setTimeout(() => {
              setChats(prev => removeDuplicateUsers(prev));
            }, 100);

            // Ensure Recent reflects server time and stays on top
            setRecent((prev) => {
              const updatedItem = {
                id: String(receiverId),
                name: selectedChat.name,
                color: selectedChat.color,
                role: selectedChat.role,
                unread: 0,
                lastMessageAt: sentAt,
                lastMessage: `You: ${text}`,
                messages: [],
              };
              const others = prev.filter((r) => r.id !== String(receiverId));
              return [updatedItem, ...others];
            });
          })
          .catch((err) => {
            console.error("Failed to persist message:", err);
          });
      } catch (err) {
        console.error("Send message error:", err);
      }
    }
    setInput("");
  };

  function formatTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (diffMs >= oneDayMs) {
      // If more than 24 hours, show date
      return d.toLocaleDateString("en-US", { 
        month: "short", 
        day: "2-digit" 
      });
    } else {
      // If less than 24 hours, show time
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
  }

  function formatSmartTime(date) {
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (diffMs >= oneDayMs) {
      return d.toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(dateStr) {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (diffMs >= oneDayMs) {
        // If more than 24 hours, show full date and time
        return d.toLocaleString("en-US", { 
          month: "short", 
          day: "2-digit", 
          year: "numeric",
          hour: "2-digit", 
          minute: "2-digit" 
        });
      } else {
        // If less than 24 hours, show time only
        return d.toLocaleTimeString("en-US", { 
          hour: "2-digit", 
          minute: "2-digit" 
        });
      }
    } catch (e) {
      return String(dateStr || "");
    }
  }

  // Truncate preview text consistently (mobile vs desktop)
  const truncatePreview = (text) => {
    if (!text) return "";
    const str = String(text);
    const limit = isMobile ? 42 : 72; // slightly shorter on mobile
    if (str.length <= limit) return str;
    return str.slice(0, limit - 1).trimEnd() + "…";
  };

  const roleBracket = (roleId) => {
    const r = Number(roleId);
    if (r === 1) return "Owner";
    if (r === 2) return "Admin";
    if (r === 3) return "Teacher";
    if (r === 4) return "Parent";
    return "User";
  };

  function getQuickReplies(type, chat) {
      // User roles: 2=Admin, 3=Teacher, 4=Parent
      if (!chat) return [
        "Great job!",
        "Thank you!",
        "I'm proud of you!",
        "Can you tell me more?",
        "Let's try together!",
      ];
  
      if (type === 'group') {
        const gt = (chat.groupType || '').toLowerCase();
        if (gt === 'staff') {
          return [
            "Faculty meeting at 3 PM today.",
            "Please submit lesson plans by 5 PM.",
            "Do you need any materials or support?",
            "Kindly update grades by end of day.",
            "Thank you, team!",
          ];
        }
        if (gt === 'class') {
          return [
            "Meeting reminder for tomorrow.",
            "Field trip consent forms are due Friday.",
            "Great effort today, everyone!",
            "Parent–teacher conference schedule is posted.",
            "Please bring art materials tomorrow.",
          ];
        }
        // Overall (community)
        return [
          "Reminder: School fair this Friday!",
          "Please check the weekly newsletter.",
          "Emergency drill tomorrow at 10 AM.",
          "Congratulations to our star learners!",
          "Share meeting details.",
        ];
      }
  
      // One-on-one - Admin responses to different roles
      switch (Number(chat.role)) {
        case 1: // Owner/Super Admin
          return [
            "Review system reports today.",
            "Check latest updates.",
            "Need help? Let me know.",
            "I'm here to assist.",
            "Thanks for your leadership.",
          ];
        case 2: // Other Admin
          return [
            "Let's coordinate the event.",
            "Share enrollment data, please.",
            "I'll review your reports.",
            "Let's meet this week.",
            "Great work recently!",
          ];
        case 3: // Teacher
          return [
            "Submit lesson plans by Friday.",
            "Need classroom resources?",
            "Faculty meeting at 3 PM.",
            "Update grades today.",
            "Thanks for teaching dedication.",
          ];
        case 4: // Parent
          return [
            "Thanks for your inquiry.",
            "I'll check this matter.",
            "See parent portal updates.",
            "Need more help?",
            "We value your support.",
          ];
        default:
          return [
            "How can I help?",
            "Thanks for reaching out.",
            "I'll reply soon.",
            "Need anything else?",
            "Here to support you.",
          ];
      }
      
    }
  
  // SVG helpers for playful background
  const buildPuzzleSvg = (fill, rotated) =>
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>` +
    `<g fill='${fill}'${rotated ? " transform='rotate(90 60 60)'" : ''}>` +
    `<path d='M30 0h60v30a15 15 0 1 1 0 30v30H60a15 15 0 1 0-30 0H0V60a15 15 0 1 0 0-30V0z'/>` +
    `</g></svg>`;
  const svgBg = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  const puzzleColors = [
    '#a78bfa', // purple
    '#f472b6', // pink
    '#34d399', // green
    '#facc15', // yellow
    '#fb923c', // orange
    '#2dd4bf', // teal
    '#60a5fa', // blue
  ];
  const [puzzlePieces, setPuzzlePieces] = useState([]);

  useEffect(() => {
    const gen = () => {
      const pieces = Array.from({ length: 5 }).map((_, idx) => ({
        id: idx,
        top: 10 + Math.random() * 80, // 10% - 90%
        left: 10 + Math.random() * 80, // 10% - 90%
        size: 80 + Math.round(Math.random() * 80), // 80px - 160px
        rot: Math.round(Math.random() * 360),
        rotated: Math.random() < 0.5,
        color: puzzleColors[Math.floor(Math.random() * puzzleColors.length)],
      }));
      setPuzzlePieces(pieces);
    };
    gen();
    const onResize = () => gen();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Track if viewport is mobile (Tailwind 'sm' < 640px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Load unsent messages from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('unsentMessages');
    if (stored) {
      try {
        setUnsentMessages(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse unsent messages from localStorage:', e);
      }
    }
  }, []);

  // Save unsent messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('unsentMessages', JSON.stringify(unsentMessages));
  }, [unsentMessages]);

  // Clean up old unsent messages (older than 24 hours)
  useEffect(() => {
    const cleanupOldUnsent = () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      setUnsentMessages((prev) => {
        const cleaned = {};
        Object.keys(prev).forEach(userId => {
          const messages = prev[userId].filter(msg => {
            const msgTime = new Date(msg.timestamp);
            return msgTime > oneDayAgo;
          });
          if (messages.length > 0) {
            cleaned[userId] = messages;
          }
        });
        return cleaned;
      });
    };

    // Clean up every hour
    const interval = setInterval(cleanupOldUnsent, 60 * 60 * 1000);
    cleanupOldUnsent(); // Initial cleanup
    
    return () => clearInterval(interval);
  }, []);

  // Function to clear unsent messages for a specific user when a new message is sent
  const clearUnsentMessages = (userId) => {
    setUnsentMessages((prev) => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  // Function to fetch user photos for group message senders
  const fetchUserPhotosForGroupMessages = async (messages) => {
    try {
      const uniqueSenderIds = [...new Set(messages.map(msg => msg.senderId).filter(Boolean))];
      const newPhotos = {};
      
      for (const senderId of uniqueSenderIds) {
        // Skip if we already have this user's photo
        if (userPhotos[senderId] || photosFetchedRef.current.has(senderId)) {
          continue;
        }
          
        try {
          const res = await fetch(API.user.getUserDetails(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: senderId })
          });
          const data = await safeJsonParse(res);
          
          if (data?.status === 'success' && data.user?.photo) {
            newPhotos[senderId] = data.user.photo;
            updateAnyUserPhoto(senderId, data.user.photo);
          }
          
          // Mark as processed
          photosFetchedRef.current.add(senderId);
        } catch (err) {
          console.error(`Failed to fetch photo for user ${senderId}:`, err);
          photosFetchedRef.current.add(senderId);
        }
      }
      
      // Update userPhotos state if we found new photos
      if (Object.keys(newPhotos).length > 0) {
        setUserPhotos(prev => ({ ...prev, ...newPhotos }));
        console.log('Fetched new user photos for group messages:', newPhotos);
      }
    } catch (err) {
      console.error('Error fetching user photos for group messages:', err);
    }
  };

  // Function to fetch user photos for all group members
  const fetchUserPhotosForGroupMembers = async (groups) => {
    try {
      const uniqueUserIds = new Set();
      
      // Collect all user IDs from group participants
      for (const group of groups) {
        if (group.groupType === 'Class' && group.groupRefId) {
          // For class groups, we need to fetch advisory teachers and parents
          try {
            // Since we can't directly query by advisory_id, we'll use a different approach
            // We'll fetch all users and filter by role to get teachers, and use get_all_users for parents
            const usersRes = await fetch(API.user.getAllUsers());
            const usersData = await safeJsonParse(usersRes);
            
            if (usersData?.success && usersData.data) {
              // Add all teachers (role 3) and admins (role 2) and owners (role 1)
              usersData.data.forEach(user => {
                if ([1, 2, 3].includes(Number(user.user_role))) {
                  uniqueUserIds.add(String(user.user_id));
                }
              });
              
              // For parents, we'll add all active parents (role 4)
              usersData.data.forEach(user => {
                if (Number(user.user_role) === 4 && user.user_status === 'Active') {
                  uniqueUserIds.add(String(user.user_id));
                }
              });
            }
          } catch (err) {
            console.error(`Failed to fetch users for class group ${group.id}:`, err);
          }
        } else if (group.groupType === 'Staff') {
          // For staff groups, fetch all teachers, admins, and owners
          try {
            const usersRes = await fetch(API.user.getAllUsers());
            const usersData = await safeJsonParse(usersRes);
            
            if (usersData?.success && usersData.data) {
              usersData.data.forEach(user => {
                if ([1, 2, 3].includes(Number(user.user_role))) { // Owner, Admin, Teacher
                  uniqueUserIds.add(String(user.user_id));
                }
              });
            }
          } catch (err) {
            console.error('Failed to fetch staff users:', err);
          }
        } else if (group.groupType === 'Overall') {
          // For overall groups, fetch all active users
          try {
            const usersRes = await fetch(API.user.getAllUsers());
            const usersData = await safeJsonParse(usersRes);
            
            if (usersData?.success && usersData.data) {
              usersData.data.forEach(user => {
                if (user.user_status === 'Active') {
                  uniqueUserIds.add(String(user.user_id));
                }
              });
            }
          } catch (err) {
            console.error('Failed to fetch overall users:', err);
          }
        }
      }
      
      // Fetch photos for all unique users
      const newPhotos = {};
      for (const userId of uniqueUserIds) {
        // Skip if we already have this user's photo
        if (userPhotos[userId] || photosFetchedRef.current.has(userId)) {
          continue;
        }
        
        try {
          const res = await fetch(API.user.getUserDetails(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
          });
          const data = await safeJsonParse(res);
          
          if (data?.status === 'success' && data.user?.photo) {
            newPhotos[userId] = data.user.photo;
            updateAnyUserPhoto(userId, data.user.photo);
          }
          
          // Mark as processed
          photosFetchedRef.current.add(userId);
        } catch (err) {
          console.error(`Failed to fetch photo for user ${userId}:`, err);
          photosFetchedRef.current.add(userId);
        }
      }
      
      // Update userPhotos state if we found new photos
      if (Object.keys(newPhotos).length > 0) {
        setUserPhotos(prev => ({ ...prev, ...newPhotos }));
        console.log('Fetched new user photos for group members:', newPhotos);
      }
    } catch (err) {
      console.error('Error fetching user photos for group members:', err);
    }
  };

  // Helper function to render user avatar
  const renderUserAvatar = (userId, role, size = "w-10 h-10") => {
    // Try to get photo from UserContext first, then fall back to local state
    const contextPhoto = getUserPhoto(userId);
    const localPhoto = userPhotos[userId];
    const photo = contextPhoto || localPhoto;
    
    console.log('renderUserAvatar called for userId:', userId, 'role:', role, 'contextPhoto:', contextPhoto, 'localPhoto:', localPhoto);
    
    // Always show FaUser icon as fallback - either when no photo or when photo fails to load
    if (photo) {
      return (
        <div className="relative">
          <img
            src={photo.startsWith('http') ? photo : API.uploads.getUploadURL(photo)}
            alt="User"
            className={`${size} rounded-full object-cover border border-gray-200 shadow-sm ${roleAvatarRingClasses(role)}`}
            onError={(e) => {
              // Fallback to FaUser icon if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* FaUser fallback icon - always present but hidden by default */}
          <div className={`${size} rounded-full bg-white text-[#1E2A79] border border-gray-200 flex items-center justify-center shadow-sm ${roleAvatarRingClasses(role)} absolute inset-0`} style={{display: 'none'}}>
            <FaUser />
          </div>
        </div>
      );
    }
    
    // No photo available - show FaUser icon directly
    return (
      <div className={`${size} rounded-full bg-white text-[#1E2A79] border border-gray-200 flex items-center justify-center shadow-sm ${roleAvatarRingClasses(role)}`}>
        <FaUser />
      </div>
    );
  };

  // Ensure conversation history is loaded when needed
  useEffect(() => {
    if (activeTab === "Users" && !isSearchFocused && chats.length === 0) {

      restoreConversationHistory();
    }
  }, [activeTab, isSearchFocused, chats.length]);

  // Refresh unread counts when Users tab becomes active
  useEffect(() => {
    if (activeTab === "Users") {
      const refreshUnreadCounts = async () => {
        try {
          const uid = Number(localStorage.getItem('userId'));
          if (!uid) return;
          
          const res = await fetch(`${API.communication.getUsers()}?user_id=${uid}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          
          const data = await safeJsonParse(res);
          if (data?.success && data.data) {
            // Update the unread counts in both chats and recent arrays
            setChats((prev) => {
              return prev.map((c) => {
                const updatedUser = data.data.find(u => String(u.user_id) === c.id);
                if (updatedUser) {
                  return { ...c, unread: Number(updatedUser.unread_count || 0) };
                }
                return c;
              });
            });
            
            setRecent((prev) => {
              return prev.map((r) => {
                const updatedUser = data.data.find(u => String(u.user_id) === r.id);
                if (updatedUser) {
                  return { ...r, unread: Number(updatedUser.unread_count || 0) };
                }
                return r;
              });
            });
            

          }
        } catch (err) {
          console.error('Error refreshing unread counts:', err);
        }
      };
      
      // Refresh unread counts when Users tab becomes active
      refreshUnreadCounts();
    }
  }, [activeTab]);

  // Clean up duplicates whenever chats array changes
  useEffect(() => {
    if (chats.length > 0) {
      const uniqueChats = removeDuplicateUsers(chats);
      if (uniqueChats.length !== chats.length) {
  
        setChats(uniqueChats);
      }
    }
  }, [chats]);

  return (
    <ProtectedRoute role="Admin">
      <div className="fixed inset-0 bg-[#f4f9ff]">
        <div className="flex h-full overflow-hidden">
          <main className="flex-1 flex flex-col h-full min-w-0">
            <div className="flex flex-1 overflow-hidden min-w-0">
              {/* LEFT SIDEBAR CHAT LIST */}
              <div className={`${isMobile && selectedChatId ? 'hidden' : 'flex'} w-full sm:w-[320px] flex-col bg-white border-r min-w-0`}>
                {/* Search Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push('/AdminSection/Dashboard')}
                        className="p-2 rounded-full hover:bg-gray-100 text-[#1E2A79]"
                        title="Back to Dashboard"
                      >
                        <FaArrowLeft />
                      </button>
                      <h2 className="font-extrabold text-[#1E2A79] text-2xl">Messages</h2>
                    </div>

                  </div>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        // Always set search focused when typing and load all users
                        setIsSearchFocused(true);
                        // Only load all users if we don't have them already or if query is empty
                        // Also ensure we don't interfere with the currently selected user
                        if (e.target.value.trim() === '' || chats.length === 0) {
                          loadAllUsersForSearch();
                        }
                      }}
                      onFocus={() => {
                        // Set search focused and load all users when search bar is clicked
                        setIsSearchFocused(true);
                        // Always load all users when search is focused to ensure fresh data
                        // This won't interfere with the selected user as it only updates the search results
                        loadAllUsersForSearch();
                      }}
                      onBlur={() => {
                        // When search loses focus, restore conversation history
                        setTimeout(() => {
                          if (!query.trim()) {
                            setIsSearchFocused(false);
                            // Only restore conversation history if no user is currently selected
                            // This prevents interference with the selected user from search results
                            if (!selectedChatId) {
      
                              restoreConversationHistory();
                            } else {
                              
                            }
                          }
                        }, 300); // Increased delay to allow button clicks and prevent race conditions
                      }}
                      placeholder="Search names to connect..."
                      className="w-full pl-12 pr-10 py-2.5 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 caret-[#1E2A79]"
                      ref={searchInputRef}
                    />
                    {(isSearchFocused || query) && (
                      <button
                        onClick={() => {
                          if (query) {
                            setQuery("");
                            setIsSearchFocused(false);
                            searchInputRef.current?.blur();
                            if (!selectedChatId) {
                              setTimeout(() => { restoreConversationHistory(); }, 100);
                            }
                          } else {
                            // When focused with empty query, act as a cancel/back action
                            setIsSearchFocused(false);
                            setQuery("");
                            searchInputRef.current?.blur();
                            if (!selectedChatId) {
                              setTimeout(() => { restoreConversationHistory(); }, 100);
                            }
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        aria-label="Clear search"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  {/* Tabs with unread badges */}
                  <div className="mt-3 flex items-center gap-1 bg-[#1E2A79] rounded-full p-1">
                    {[
                      { key: "Users", label: "Users", count: usersUnreadTotal },
                      { key: "Groups", label: "Groups", count: groupsUnreadTotal },
                      { key: "Archive", label: "Archive", count: 0 },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 text-sm px-3 py-1.5 rounded-full transition flex items-center justify-center gap-1 ${activeTab === tab.key ? "bg-white text-[#1E2A79] shadow" : "text-white/80 hover:text-white"}
                          `}
                      >
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] bg-red-600 text-white">
                            {tab.count > 99 ? "99+" : tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Chat List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                                  {/* Users Tab - Shows conversation history with users */}
                {activeTab === "Users" && (
                  <>
                    {/* Debug info */}

                    
                    {/* Show loading indicator when conversations are being loaded */}
                    {isLoadingConversations && (
                      <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                        <div className="w-10 h-10 rounded-full bg-[#1E2A79] text-white flex items-center justify-center font-bold mb-2">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium">Loading conversations...</p>
                        <p className="text-xs">Please wait while we load your message history.</p>
                      </div>
                    )}
                    
                    {/* Show conversation history - users the logged-in user has messaged with */}
                    {!isLoadingConversations && !isSearchFocused && (
                      (recent.length === 0 && chats.length === 0) ? (
                        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                          <div className="w-10 h-10 rounded-full bg-[#1E2A79] text-white flex items-center justify-center font-bold mb-2"><FaUser /></div>
                          <p className="text-sm font-medium">No conversations yet</p>
                          <p className="text-xs">Start messaging someone to see them here.</p>
                        </div>
                      ) : recent.length === 0 && chats.length > 0 ? (
                          // If no recent conversations but we have conversation history users, show them
                          <>
                            <p className="text-xs text-gray-500 px-2">Previous Conversations</p>
                            {chats.map((chat, index) => {
                              const isSelected = selectedType === "user" && chat.id === selectedChatId;
                              return (
                                <button
                                  key={`chat-${chat.id}-${index}`}
                                                                  onClick={() => {
                                  setSelectedType("user");
                                  setSelectedChatId(chat.id);
                                  
                                  // Always trigger conversation loading for users from conversation history
                                  // This ensures the conversation is displayed in the right panel
                                  
                                  // Use a small delay to ensure state updates are processed first
                                  setTimeout(() => {
                                    manuallyLoadConversation(chat.id);
                                  }, 50);
                                }}
                                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl border transition shadow-sm ${isSelected ? 'bg-[#eef2ff] border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                  <div className="relative">
                                    {renderUserAvatar(chat.id, chat.role)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-[#1E2A79] text-sm truncate">{chat.name}</p>
                                      {chat.lastMessageAt && (
                                        <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{formatTime(chat.lastMessageAt)}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <p className={`flex-1 min-w-0 text-xs pr-2 truncate ${chat.isLastUnsent ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                                        {truncatePreview(chat.lastMessage) || ""}
                                      </p>
                                      {chat.unread > 0 && (
                                        <span className="text-[10px] bg-[#1E2A79] text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ml-2">
                                          {chat.unread}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        ) : (
                          // Show recent conversations when not searching
                          recent.map((chat, index) => {
                            const isSelected = selectedType === "user" && chat.id === selectedChatId;
                            return (
                              <button
                                key={`recent-${chat.id}-${index}`}
                                onClick={() => {
                                  setSelectedType("user");
                                  setSelectedChatId(chat.id);
                                  
                                  // Always trigger conversation loading for users from recent conversations
                                  // This ensures the conversation is displayed in the right panel
                                  
                                  // Use a small delay to ensure state updates are processed first
                                  setTimeout(() => {
                                    manuallyLoadConversation(chat.id);
                                  }, 50);
                                }}
                                className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl border transition shadow-sm min-h-[64px] ${isSelected ? 'bg-[#eef2ff] border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                              >
                                <div className="relative">
                                  {renderUserAvatar(chat.id, chat.role)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-[#1E2A79] text-sm truncate">{chat.name}</p>
                                    {chat.lastMessageAt && (
                                      <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{formatTime(chat.lastMessageAt)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <p className={`flex-1 min-w-0 text-xs pr-2 truncate ${chat.isLastUnsent ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                                      {truncatePreview(chat.lastMessage) || ""}
                                    </p>
                                    {chat.unread > 0 && (
                                      <span className="text-[10px] bg-[#1E2A79] text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ml-2">
                                        {chat.unread}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )
                      )}
                      {isSearchFocused && (
                        <>
                          <p className="text-xs text-gray-500 px-2">Search Results - All Active Users</p>
                          {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                              <div className="w-10 h-10 rounded-full bg-[#1E2A79] text-white flex items-center justify-center font-bold mb-2"><FaUser /></div>
                              <p className="text-sm font-medium">No users found</p>
                              <p className="text-xs">Try a different search.</p>
                            </div>
                          ) : (
                            filteredUsers.map((chat, index) => {
                              const isSelected = selectedType === "user" && chat.id === selectedChatId;
                              return (
                                <button
                                  key={`search-${chat.id}-${index}`}
                                  onClick={async () => {
                                    // Set the selected user FIRST to prevent the "No conversation selected" state
                                    setSelectedType("user");
                                    setSelectedChatId(chat.id);
                                    // Provide temporary selected chat so right pane can render immediately
                                    setTempSelectedChat({
                                      id: chat.id,
                                      name: chat.name,
                                      color: chat.color,
                                      role: chat.role,
                                      unread: 0,
                                      lastMessageAt: chat.lastMessageAt || null,
                                      lastMessage: chat.lastMessage || "",
                                      messages: [],
                                      photo: chat.photo || null,
                                    });
                                    
                                    // Clear search state AFTER setting the selected user
                                    setIsSearchFocused(false);
                                    setQuery("");
                                    searchInputRef.current?.blur();
                                    
                                    // Check if this user has conversation history
                                    const hasHistory = await checkUserConversationHistory(chat.id);
                                    
                                    // Also check if this user exists in recent conversations (which means they have history)
                                    const hasRecentHistory = recent.some(r => r.id === chat.id);
                                    const hasChatsHistory = chats.some(c => c.id === chat.id && c.lastMessage && c.lastMessage.trim() !== '');
                                    
                                    const shouldLoadConversation = hasHistory || hasRecentHistory || hasChatsHistory;
                                    
                                    if (shouldLoadConversation) {
                                      // User has conversation history - load their messages
                                      const uid = Number(localStorage.getItem('userId')) || 0;
                                      if (uid) {
                                        try {
                                          // Mark as running to prevent the conversation loading useEffect from interfering
                                          isRunningRef.current.conversation = chat.id;
                                          
                                          // Load conversation data first, then update chats array in one operation
                                          const res = await fetch(`${API.communication.getConversation()}?user_id=${uid}&partner_id=${chat.id}`, {
                                            method: "GET",
                                            headers: { "Content-Type": "application/json" },
                                          });
                                          const data = await safeJsonParse(res);
                                          
                                          if (data?.success && data.data && data.data.length > 0) {
                                            const msgs = data.data.map((m) => ({
                                              id: String(m.message_id),
                                              from: Number(m.sender_id) === uid ? 'self' : 'other',
                                              text: m.is_unsent == 1 ? '' : m.message_text,
                                              isUnsent: m.is_unsent == 1,
                                              edited: m.is_edited == 1,
                                              isRead: m.is_read == 1,
                                              time: m.sent_at ? new Date(m.sent_at) : new Date(),
                                            }));
                                            
                                            // Update the chats array in one operation to prevent duplicates
                                            setChats((prev) => {
                                              const existingUser = prev.find(c => c.id === chat.id);
                                              if (existingUser) {
                                                // Update existing user with messages
                                                return prev.map(c => 
                                                  c.id === chat.id ? { ...c, messages: msgs } : c
                                                );
                                              } else {
                                                // Add new user with conversation data
                                                const newUser = {
                                                  id: chat.id,
                                                  name: chat.name,
                                                  color: chat.color,
                                                  role: chat.role,
                                                  unread: 0,
                                                  lastMessageAt: msgs.length > 0 ? msgs[msgs.length - 1].time : null,
                                                                                                      lastMessage: msgs.length > 0 ? 
                                                      (msgs[msgs.length - 1].from === 'self' ? 
                                                       `You: ${msgs[msgs.length - 1].text}` : 
                                                       msgs[msgs.length - 1].text) : "",
                                                  messages: msgs,
                                                  photo: chat.photo,
                                                };
                                                return [...prev, newUser];
                                              }
                                            });
                                            
                                            // Clean up any duplicates that might have been created
                                            setTimeout(() => {
                                              setChats(prev => removeDuplicateUsers(prev));
                                            }, 100);
                                            // Keep tempSelectedChat; it will be ignored once real data is present
                                            

                                          } else {
                                            // No messages found, but user might still exist - ensure they're in chats array
                                            setChats((prev) => {
                                              const existingUser = prev.find(c => c.id === chat.id);
                                              if (!existingUser) {
                                                const newUser = {
                                                  id: chat.id,
                                                  name: chat.name,
                                                  color: chat.color,
                                                  role: chat.role,
                                                  unread: 0,
                                                  lastMessageAt: null,
                                                  lastMessage: "",
                                                  messages: [],
                                                  photo: chat.photo,
                                                };
                                                return [...prev, newUser];
                                              }
                                              return prev;
                                            });
                                          }
                                          
                                          // Mark as not running after successful load
                                          isRunningRef.current.conversation = null;
                                                } catch (err) {
          console.error('Error loading conversation for search result user:', chat.id, err);
          // Mark as not running on error
          isRunningRef.current.conversation = null;
        }
                                      }
                                    } else {
                                      // User has no conversation history - add them to chats array with empty messages
                                      
                                      setChats((prev) => {
                                        const existingUser = prev.find(c => c.id === chat.id);
                                        if (!existingUser) {
                                          const newUser = {
                                            id: chat.id,
                                            name: chat.name,
                                            color: chat.color,
                                            role: chat.role,
                                            unread: 0,
                                            lastMessageAt: null,
                                            lastMessage: "",
                                            messages: [],
                                            photo: chat.photo,
                                          };
                                          return [...prev, newUser];
                                        }
                                        return prev;
                                      });
                                      
                                      // Clean up any duplicates that might have been created
                                      setTimeout(() => {
                                        setChats(prev => removeDuplicateUsers(prev));
                                      }, 100);
                                    }
                                    
                                    // Ensure the selected user stays selected by preventing any interference
                                    // The user list will be properly managed by the existing state

                                  }}
                                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl border transition shadow-sm ${isSelected ? 'bg-[#eef2ff] border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                  <div className="relative">
                                    {renderUserAvatar(chat.id, chat.role)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-[#1E2A79] text-sm truncate">{chat.name}</p>
                                      {chat.lastMessageAt && (
                                        <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{formatTime(chat.lastMessageAt)}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <p className={`text-xs pr-2 overflow-hidden text-ellipsis whitespace-nowrap ${chat.isLastUnsent ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                                        {truncatePreview(chat.lastMessage) || ""}
                                      </p>
                                      {chat.unread > 0 && (
                                        <span className="text-[10px] bg-[#1E2A79] text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ml-2">
                                          {chat.unread}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Groups Tab - Shows groups based on user role access:
                      Super Admin/Admin: All groups (General, Staff, All Classes)
                      Teacher: General, Staff, Assigned Classes
                      Parent: General, Child's Assigned Classes */}
                  {activeTab === "Groups" && (
                    <>
                      {/* Show groups based on user role permissions */}
                      {console.log('Groups tab rendering - filteredGroups:', filteredGroups, 'length:', filteredGroups.length)}
                      {filteredGroups.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                          <div className="w-10 h-10 rounded-full bg-[#1E2A79] text-white flex items-center justify-center font-bold mb-2"><FaUsers /></div>
                          <p className="text-sm font-medium">No accessible groups</p>
                          <p className="text-xs">Groups are shown based on your role permissions.</p>
                        </div>
                      )}
                      {filteredGroups.map((grp) => {
                        const isSelected = selectedType === "group" && grp.id === selectedChatId;
                        


                        return (
                          <button
                            key={grp.id}
                            onClick={() => {
                              setSelectedType("group");
                              setSelectedChatId(grp.id);
                            }}
                            className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl border transition shadow-sm min-h-[64px] ${isSelected ? "bg-[#eef2ff] border-blue-500" : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                              <img 
                                src={(() => {
                                  if (grp.groupType === 'Class') {
                                    console.log('Class group detected:', grp.name, 'groupRefId:', grp.groupRefId, 'type:', typeof grp.groupRefId);
                                    const photo = getClassPhoto(grp.groupRefId, grp.name);
                                    console.log('Selected photo for', grp.name, ':', photo);
                                    return photo;
                                  } else {
                                    return getGroupPhoto(grp.groupType);
                                  }
                                })()} 
                                alt={grp.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to colored initials if image fails to load
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className={`w-full h-full ${grp.color} text-white flex items-center justify-center font-bold shadow-sm`} style={{display: 'none'}}>
                                {getInitials(grp.name)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-[#1E2A79] text-sm truncate">{grp.name}</p>
                                <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{grp.lastMessageAt ? formatTime(grp.lastMessageAt) : ''}</span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className={`flex-1 min-w-0 text-xs pr-2 truncate ${grp.isLastUnsent ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                                  {truncatePreview(grp.lastMessage) || ""}
                                </p>
                                {grp.unread > 0 && (
                                  <span className="text-[10px] bg-[#1E2A79] text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ml-2">
                                    {grp.unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Archive Tab - Shows archived conversations */}
                  {activeTab === "Archive" && (
                    <>
                      {archived.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                          <div className="w-10 h-10 rounded-full bg-[#1E2A79] text-white flex items-center justify-center font-bold mb-2">A</div>
                          <p className="text-sm font-medium">No archived chats</p>
                          <p className="text-xs">Archive conversations to find them here.</p>
                        </div>
                      ) : (
                        archived.map((chat) => (
                          <button
                            key={chat.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedType("archived");
                              setSelectedChatId(chat.id);
                            }}
                            className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl border transition shadow-sm bg-white border-gray-200 hover:bg-gray-50`}
                          >
                            <div className="relative">
                              {renderUserAvatar(chat.id, chat.role)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-[#1E2A79] text-sm truncate">{chat.name}</p>
                                {chat.lastMessageAt && (
                                  <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{formatTime(chat.lastMessageAt)}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400">Archived</div>
                            </div>
                          </button>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT CHAT SECTION */}
              <div className={`${isMobile && !selectedChatId ? 'hidden' : 'flex'} relative flex-col flex-1 bg-[#f4f9ff] min-w-0 overflow-x-hidden`}>
                <div
                  className="pointer-events-none absolute inset-0 -z-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse at 12% 20%, rgba(30,42,121,0.06), transparent 45%)," +
                      "radial-gradient(ellipse at 85% 10%, rgba(255, 221, 87, 0.12), transparent 40%)," +
                      "radial-gradient(ellipse at 85% 85%, rgba(56, 189, 248, 0.10), transparent 45%)," +
                      "radial-gradient(ellipse at 10% 85%, rgba(167, 243, 208, 0.10), transparent 45%)",
                  }}
                />
                {/* Random puzzle pieces (max 5) */}
                {puzzlePieces.map((p) => (
                  <div
                    key={p.id}
                    className="pointer-events-none absolute -z-0 opacity-[0.08]"
                    style={{
                      top: `${p.top}%`,
                      left: `${p.left}%`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      backgroundImage: svgBg(buildPuzzleSvg(p.color, p.rotated)),
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
                    }}
                  />
                ))}
                {/* Bubbles overlay */}
                <div
                  className="pointer-events-none absolute inset-0 -z-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 30%, rgba(59,130,246,0.14) 0, rgba(59,130,246,0.14) 6px, transparent 7px)," +
                      "radial-gradient(circle at 70% 60%, rgba(147,197,253,0.12) 0, rgba(147,197,253,0.12) 8px, transparent 9px)," +
                      "radial-gradient(circle at 40% 80%, rgba(99,102,241,0.10) 0, rgba(99,102,241,0.10) 7px, transparent 8px)",
                    backgroundSize: '140px 140px, 180px 180px, 160px 160px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                {/* Puzzle pattern overlay */}
                <div
                  className="pointer-events-none absolute inset-0 -z-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,\" + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>\n<g fill='%231e2a79'>\n<path d='M30 0h60v30a15 15 0 1 1 0 30v30H60a15 15 0 1 0-30 0H0V60a15 15 0 1 0 0-30V0z'/>\n</g>\n</svg>`))",
                    backgroundSize: '120px 120px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                {/* Bubbles overlay */}
                <div
                  className="pointer-events-none absolute inset-0 -z-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 30%, rgba(59,130,246,0.14) 0, rgba(59,130,246,0.14) 6px, transparent 7px)," +
                      "radial-gradient(circle at 70% 60%, rgba(147,197,253,0.12) 0, rgba(147,197,253,0.12) 8px, transparent 9px)," +
                      "radial-gradient(circle at 40% 80%, rgba(99,102,241,0.10) 0, rgba(99,102,241,0.10) 7px, transparent 8px)",
                    backgroundSize: '140px 140px, 180px 180px, 160px 160px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                {/* If no chat selected, show fallback or loading when a user is being opened */}
                {!selectedChat ? (
                  <div className="flex-1 flex items-center justify-center text-center text-gray-500 relative z-10">
                    {selectedChatId && tempSelectedChat && tempSelectedChat.id === selectedChatId ? (
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="mx-auto w-16 h-16 rounded-full bg-white border border-gray-300 flex items-center justify-center text-[#1E2A79] mb-3">
                          {renderUserAvatar(tempSelectedChat.id, tempSelectedChat.role, "w-full h-full")}
                        </div>
                        <p className="font-semibold text-[#1E2A79]">{tempSelectedChat.name}</p>
                        <p className="text-xs mt-1">No messages yet. Say hello!</p>
                      </div>
                    ) : selectedChatId && selectedType === 'user' && (isRunningRef.current.conversation === selectedChatId || isLoadingSpecificConversation || isLoadingConversations) ? (
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-10 h-10 rounded-full bg-[#1E2A79] text-white flex items-center justify-center font-bold mb-3">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-700">Loading conversation...</h3>
                        <p className="text-xs text-gray-500 mt-1">Please wait a moment.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-[#1e2a79] to-[#232c67] rounded-full flex items-center justify-center">
                            <FaUser className="text-4xl text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">💬</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No conversation selected</h3>
                        <p className="text-sm text-gray-500 mb-4 max-w-64 leading-relaxed">
                          Search and select a user or group to start messaging. Your conversations will appear here once you begin chatting.
                        </p>
                        <div className="flex items-center gap-3 text-xs text-blue-600">
                          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                          <span className="font-medium">Ready to connect!</span>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b bg-white flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (isMobile) {
                              setSelectedChatId("");
                              setSelectedType("user");
                            } else {
                              router.push('/AdminSection/Dashboard');
                            }
                          }}
                          className="p-2 rounded-full hover:bg-gray-100 text-[#1E2A79] sm:hidden"
                          title="Back"
                        >
                          <FaArrowLeft />
                        </button>
                        <div className={`w-11 h-11 ${selectedType === 'group' ? 'rounded-xl' : 'rounded-full'} overflow-hidden flex-shrink-0 bg-white border border-gray-300 shadow-sm`}>
                          {selectedType === 'group' ? (
                            <img 
                              src={(() => {
                                const groupType = selectedChat?.groupType || '';
                                if (groupType === 'Class') {
                                  // Use the class-specific photo based on group_ref_id
                                  const groupRefId = selectedChat?.groupRefId;
                                  const groupName = selectedChat?.name;
                                  return getClassPhoto(groupRefId, groupName);
                                } else {
                                  // Use the general group photo logic
                                  switch (groupType.toLowerCase()) {
                                    case 'overall':
                                    default:
                                      return '/assets/image/general_gc_photo.png';
                                  }
                                }
                              })()}
                              alt={selectedChat?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to colored initials if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          {selectedType === 'group' && (
                            <div className={`w-full h-full ${selectedChat?.color || 'bg-gray-500'} text-white flex items-center justify-center font-bold shadow-sm`} style={{display: selectedType === 'group' ? 'none' : 'flex'}}>
                              {getInitials(selectedChat?.name || '')}
                            </div>
                          )}
                          {selectedType !== 'group' && (
                            renderUserAvatar(selectedChat?.id, selectedChat?.role, "w-full h-full")
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#1E2A79] text-base leading-tight">{selectedChat?.name}</p>
                          {selectedType === 'group' && (
                            <p className="text-[11px] text-gray-500 whitespace-normal break-words">
                              {selectedChat?.participantsLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Archive icon for user conversations; show Restore for archived */}
                      {selectedType === 'user' && (() => {
                        const hasMessages = Array.isArray(selectedChat?.messages) && selectedChat.messages.length > 0;
                        const hasLastMessage = !!(selectedChat?.lastMessage && String(selectedChat.lastMessage).trim() !== '');
                        const hasRecentHistory = recent.some((r) => r.id === selectedChat?.id);
                        const hasChatsHistory = chats.some((c) => c.id === selectedChat?.id && c.lastMessage && String(c.lastMessage).trim() !== '');
                        const canArchive = hasMessages || hasLastMessage || hasRecentHistory || hasChatsHistory;
                        return canArchive ? (
                          <button
                            className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-2"
                            onClick={() => setShowArchiveModal(true)}
                            title="Archive conversation"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span className="hidden sm:inline">Archive</span>
                          </button>
                        ) : null;
                      })()}
                      {selectedType === 'archived' && (
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-2"
                          title="Restore conversation"
                          onClick={() => setShowRestoreModal(true)}
                        >
                          <FaUndo />
                          <span className="hidden sm:inline">Restore</span>
                        </button>
                      )}
                    </div>

                    {/* Messages or Empty-state for this user */}
                    {!(selectedChat?.messages && selectedChat.messages.length > 0) ? (
                      <div className="flex-1 flex items-center justify-center text-center text-gray-500 relative z-10">
                        <div>
                          <div className={`mx-auto w-16 h-16 ${selectedType === 'group' ? 'rounded-xl' : 'rounded-full'} bg-white border border-gray-300 flex items-center justify-center text-[#1E2A79] mb-3 overflow-hidden`}>
                            {selectedType === 'group' ? (
                              <img 
                                src={(() => {
                                  const groupType = selectedChat?.groupType || '';
                                  if (groupType === 'Class') {
                                    const groupRefId = selectedChat?.groupRefId;
                                    const groupName = selectedChat?.name;
                                    return getClassPhoto(groupRefId, groupName);
                                  } else {
                                    switch (groupType.toLowerCase()) {
                                      case 'overall':
                                      default:
                                        return '/assets/image/general_gc_photo.png';
                                    }
                                  }
                                })()}
                                alt={selectedChat?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              renderUserAvatar(selectedChat?.id, selectedChat?.role, "w-full h-full")
                            )}
                            {selectedType === 'group' && (
                              <div className={`w-full h-full ${selectedChat?.color || 'bg-gray-500'} text-white flex items-center justify-center font-bold shadow-sm`} style={{display: 'none'}}>
                                <FaUsers />
                              </div>
                            )}
                          </div>
                          <p className="font-semibold text-[#1E2A79]">{selectedChat?.name}</p>
                          {selectedType === 'archived' ? (
                            <div className="mt-1 text-xs">This conversation is archived.</div>
                          ) : selectedType === 'group' ? (
                            <p className="text-xs">No messages yet. Start the conversation!</p>
                          ) : (() => {
                            // Check if this user has conversation history by looking at the chats array
                            const hasConversationHistory = chats.some(c => c.id === selectedChat?.id && c.messages && c.messages.length > 0);
                            // Also check if this user exists in recent conversations (which means they have history)
                            const hasRecentHistory = recent.some(r => r.id === selectedChat?.id);
                            // Check if this user has any lastMessage (indicating previous conversation)
                            const hasLastMessage = selectedChat?.lastMessage && selectedChat.lastMessage.trim() !== '';
                            // Check if conversation is currently loading (only for user conversations)
                            const isConversationLoading = selectedType === 'user' && (isRunningRef.current.conversation === selectedChat?.id || isLoadingSpecificConversation);
                            // Check if this user was found in the conversation history API
                            const hasConversationHistoryAPI = chats.some(c => c.id === selectedChat?.id && c.lastMessage && c.lastMessage.trim() !== '');
                            // Check if this user was just selected from search results and has messages
                            const wasJustSelectedFromSearch = selectedChat?.messages && selectedChat.messages.length > 0;
                            

                            
                            if (isConversationLoading) {
                              // Show loading state
                              return (
                                <div className="mt-1">
                                  <div className="inline-flex items-center gap-2 text-xs text-blue-600">
                                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading conversation...
                                  </div>
                                </div>
                              );
                            } else if (hasConversationHistory || hasRecentHistory || hasLastMessage || hasConversationHistoryAPI) {
                              // User has conversation history but messages aren't loaded yet - show loading state
                              return (
                                <div className="mt-1">
                                  <div className="inline-flex items-center gap-2 text-xs text-blue-600">
                                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading conversation...
                                  </div>
                                </div>
                              );
                            } else {
                              // User has no conversation history at all - show "No conversation started"
                              return <p className="text-xs">No conversation started</p>;
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-8 py-4 sm:py-6 space-y-3 min-w-0">
                        {(selectedChat?.messages || []).map((msg) => {
                          const isSelf = msg.from === "self";
                          return (
                            <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                              <div className="max-w-[75%]">
                                {selectedType === 'group' && !isSelf && (
                                  <div className="mb-1 ml-1 flex items-center gap-2">
                                    {/* User Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0 relative">
                                      {(() => {
                                        const senderId = msg.senderId || msg.id;
                                        const photo = userPhotos[senderId];
                                        if (photo) {
                                          return (
                                            <>
                                              <img
                                                src={photo.startsWith('http') ? photo : API.uploads.getUploadURL(photo)}
                                                alt="Sender"
                                                className="w-full h-full rounded-full object-cover"
                                                onError={(e) => {
                                                  // Fallback to FaUser icon if image fails to load
                                                  e.target.style.display = 'none';
                                                  e.target.nextSibling.style.display = 'flex';
                                                }}
                                              />
                                              {/* FaUser fallback icon - always present but hidden by default */}
                                              <FaUser className="text-gray-600 text-sm absolute inset-0 flex items-center justify-center" style={{display: 'none'}} />
                                            </>
                                          );
                                        }
                                        // No photo available - show FaUser icon directly
                                        return <FaUser className="text-gray-600 text-sm" />;
                                      })()}
                                    </div>
                                    {/* Role and Name Chip */}
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleChipClasses(msg.senderRole)}`}>
                                      {msg.senderName || 'Member'}
                                    </span>
                                  </div>
                                )}
                                <div
                                  className={`relative ${selectedType === 'group' && showReadsForId === msg.id ? 'z-[10000]' : ''} px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base transition-all ${isSelf ? "bg-gradient-to-r from-[#28316c] to-[#1E2A79] text-white rounded-br-sm ring-1 ring-white/10" : "bg-white/90 backdrop-blur-sm text-gray-800 border border-blue-100 ring-1 ring-blue-50 rounded-bl-sm"
                                    }`}
                                  onClick={() => {
                                    // Only allow menu for own persisted messages (numeric id), non-archived, and NOT already unsent
                                    const isPersisted = /^\d+$/.test(String(msg.id));
                                    const isAlreadyUnsent = msg.isUnsent;
                                    if (isSelf && selectedType !== 'archived' && isPersisted && !isAlreadyUnsent) {
                                      setActionMenuForId((cur) => (cur === msg.id ? null : msg.id));
                                    }
                                  }}
                                >
                                  {selectedType !== 'archived' && isSelf && /^\d+$/.test(String(msg.id)) && actionMenuForId === msg.id && editingMessageId !== msg.id && (
                                    <div className="absolute top-full right-2 mt-2 bg-white text-gray-800 border border-gray-200 shadow-md rounded-lg flex items-center gap-2 px-2 py-1 z-50">
                                      <button
                                        className="flex items-center gap-1 text-xs hover:text-[#1E2A79]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingMessageId(msg.id);
                                          setEditingText(msg.text);
                                          setActionMenuForId(null);
                                        }}
                                        title="Edit"
                                      >
                                        <FaEdit />
                                        <span className="hidden sm:inline">Edit</span>
                                      </button>
                                      <span className="w-px h-4 bg-gray-200" />
                                      <button
                                        className="flex items-center gap-1 text-xs hover:text-red-600"
                                        title="Unsent"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const uid = Number(localStorage.getItem('userId'));
                                          const url = selectedType === 'group'
                                            ? API.communication.unsentGroupMessage()
                                            : API.communication.unsentMessage();
                                          const payload = selectedType === 'group'
                                            ? { group_message_id: Number(msg.id), sender_id: uid }
                                            : { message_id: Number(msg.id), sender_id: uid };
                                          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                                            .then((r) => safeJsonParse(r))
                                            .then((res) => {
                                              if (!res?.success) throw new Error(res?.error || 'Failed to unsent');
                                              // Preserve the original message timestamp instead of using current time
                                              const originalMessageTime = msg.time;
                                              if (selectedType === 'group') {
                                                setGroupChats((prev) => prev.map((g) => (
                                                  g.id === selectedChat.id
                                                    ? {
                                                        ...g,
                                                        messages: g.messages.map((m) => (m.id === msg.id ? { ...m, text: '', isUnsent: true } : m)),
                                                        lastMessage: 'You unsent a message',
                                                        lastMessageAt: originalMessageTime,
                                                      }
                                                    : g
                                                )));
                                              } else {
                                                setChats((prev) => prev.map((c) => (
                                                  c.id === selectedChat.id
                                                    ? { ...c, messages: c.messages.map((m) => (m.id === msg.id ? { ...m, text: '', isUnsent: true } : m)) }
                                                    : c
                                                )));
                                                
                                                // Update localStorage to track unsent messages
                                                const userId = selectedChat.id;
                                                setUnsentMessages((prev) => {
                                                  const current = prev[userId] || [];
                                                  const updated = [...current, { messageId: msg.id, timestamp: originalMessageTime.toISOString() }];
                                                  return { ...prev, [userId]: updated };
                                                });
                                                
                                                setRecent((prev) => {
                                                  const exists = prev.find((r) => r.id === selectedChat.id);
                                                  if (!exists) return prev;
                                                  const updated = { ...exists, lastMessage: 'You unsent a message', lastMessageAt: originalMessageTime };
                                                  // Update the existing conversation without changing its position
                                                  return prev.map((r) => r.id === selectedChat.id ? updated : r);
                                                });
                                              }
                                              setActionMenuForId(null);
                                            })
                                            .catch((err) => console.error(err));
                                        }}
                                      >
                                        <FaTrash />
                                        <span className="hidden sm:inline">Unsent</span>
                                      </button>
                                    </div>
                                  )}
                                  {editingMessageId === msg.id ? (
                                    <div className="flex items-start gap-2">
                                      <textarea
                                        className={`flex-1 bg-white text-gray-800 border rounded px-2 py-1 text-sm leading-5 min-h-[60px] caret-[#1E2A79]`}
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                            const uid = Number(localStorage.getItem('userId'));
                                            const url = selectedType === 'group'
                                              ? API.communication.editGroupMessage()
                                              : API.communication.editMessage();
                                            const payload = selectedType === 'group'
                                              ? { group_message_id: Number(msg.id), sender_id: uid, message_text: editingText.trim() }
                                              : { message_id: Number(msg.id), sender_id: uid, message_text: editingText.trim() };
                                            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                                              .then((r) => safeJsonParse(r))
                                              .then((res) => {
                                                if (!res?.success) throw new Error(res?.error || 'Failed to edit');
                                                const updatedText = editingText.trim();
                                                // Preserve the original message timestamp instead of using current time
                                                const originalMessageTime = msg.time;
                                                if (selectedType === 'group') {
                                                  setGroupChats((prev) => prev.map((g) => (
                                                    g.id === selectedChat.id
                                                      ? {
                                                          ...g,
                                                          messages: g.messages.map((m) => (m.id === msg.id ? { ...m, text: updatedText, edited: true } : m)),
                                                          lastMessage: updatedText || g.lastMessage,
                                                          lastMessageAt: originalMessageTime,
                                                        }
                                                      : g
                                                  )));
                                                } else {
                                                  setChats((prev) => prev.map((c) => (
                                                    c.id === selectedChat.id
                                                      ? { ...c, messages: c.messages.map((m) => (m.id === msg.id ? { ...m, text: updatedText, edited: true } : m)) }
                                                      : c
                                                  )));
                                                  // Update Recents preview in left panel
                                                  setRecent((prev) => {
                                                    const exists = prev.find((r) => r.id === selectedChat.id);
                                                    if (!exists) return prev;
                                                    const updated = { ...exists, lastMessage: (updatedText ? `You: ${updatedText}` : exists.lastMessage), lastMessageAt: originalMessageTime };
                                                    // Update the existing conversation without changing its position
                                                    return prev.map((r) => r.id === selectedChat.id ? updated : r);
                                                  });
                                                }
                                                setEditingMessageId(null);
                                                setEditingText("");
                                              })
                                              .catch((err) => console.error(err));
                                          } else if (e.key === 'Escape') {
                                            setEditingMessageId(null);
                                            setEditingText("");
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <div className="flex gap-2 mt-1">
                                        <button
                                          className="text-xs bg-white/20 hover:bg-white/30 text-white rounded p-1"
                                          title="Save (Ctrl+Enter)"
                                          onClick={() => {
                                            const uid = Number(localStorage.getItem('userId'));
                                            const url = selectedType === 'group'
                                              ? API.communication.editGroupMessage()
                                              : API.communication.editMessage();
                                            const payload = selectedType === 'group'
                                              ? { group_message_id: Number(msg.id), sender_id: uid, message_text: editingText.trim() }
                                              : { message_id: Number(msg.id), sender_id: uid, message_text: editingText.trim() };
                                            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                                              .then((r) => safeJsonParse(r))
                                              .then((res) => {
                                                if (!res?.success) throw new Error(res?.error || 'Failed to edit');
                                                const updatedText = editingText.trim();
                                                // Preserve the original message timestamp instead of using current time
                                                const originalMessageTime = msg.time;
                                                if (selectedType === 'group') {
                                                  setGroupChats((prev) => prev.map((g) => (
                                                    g.id === selectedChat.id
                                                      ? {
                                                          ...g,
                                                          messages: g.messages.map((m) => (m.id === msg.id ? { ...m, text: updatedText, edited: true } : m)),
                                                          lastMessage: updatedText || g.lastMessage,
                                                          lastMessageAt: originalMessageTime,
                                                        }
                                                      : g
                                                  )));
                                                } else {
                                                  setChats((prev) => prev.map((c) => (
                                                    c.id === selectedChat.id
                                                      ? { ...c, messages: c.messages.map((m) => (m.id === msg.id ? { ...m, text: updatedText, edited: true } : m)) }
                                                      : c
                                                  )));
                                                  setRecent((prev) => {
                                                    const exists = prev.find((r) => r.id === selectedChat.id);
                                                    if (!exists) return prev;
                                                    const updated = { ...exists, lastMessage: (updatedText ? `You: ${updatedText}` : exists.lastMessage), lastMessageAt: originalMessageTime };
                                                    // Update the existing conversation without changing its position
                                                    return prev.map((r) => r.id === selectedChat.id ? updated : r);
                                                  });
                                                }
                                                setEditingMessageId(null);
                                                setEditingText("");
                                              })
                                              .catch((err) => console.error(err));
                                          }}
                                        >
                                          <FaCheck />
                                        </button>
                                        <button
                                          className="text-xs bg-white/20 hover:bg-white/30 text-white rounded p-1"
                                          title="Cancel"
                                          onClick={() => { setEditingMessageId(null); setEditingText(""); }}
                                        >
                                          <FaTimes />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {msg.isUnsent ? (
                                        <p className="text-xs italic opacity-80">{`${isSelf ? 'You' : (selectedType === 'group' ? (msg.senderName || 'Member') : selectedChat?.name)} unsent a message`}</p>
                                      ) : (
                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                      )}
                                      {/* Edited badge for all message types */}
                                      {msg.edited && (
                                        <div className="mt-1 flex items-center justify-between">
                                          <div className="min-w-0">
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${isSelf ? 'text-gray-200 bg-white/10' : 'text-gray-600 bg-gray-100'}`}>
                                              <FaEdit size={9} />
                                              Edited
                                            </span>
                                          </div>
                                          {selectedType === 'group' && (
                                            <button
                                              className={`text-[12px] ${isSelf ? 'text-gray-200' : 'text-gray-600'} hover:opacity-80`}
                                              title="View seen by"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const mid = Number(msg.id);
                                                if (!mid) return;
                                                setShowReadsForId((cur) => (cur === msg.id ? null : msg.id));
                                                if (!readsCache[mid]) {
                                                  fetch(`${API.communication.getGroupMessageReads()}?group_message_id=${mid}`)
                                                    .then((r) => safeJsonParse(r))
                                                    .then((res) => {
                                                      if (!res?.success) return;
                                                      setReadsCache((prev) => ({ ...prev, [mid]: res.data || [] }));
                                                    })
                                                    .catch(() => {});
                                                }
                                              }}
                                            >
                                              <FaEye size={12} />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Group-specific controls (only show if not edited or if group) */}
                                      {selectedType === 'group' && !msg.edited && (
                                        <div className="mt-1 flex items-center justify-between">
                                          <div className="min-w-0">
                                            {/* Empty div for spacing */}
                                          </div>
                                          <button
                                            className={`text-[12px] ${isSelf ? 'text-gray-200' : 'text-gray-600'} hover:opacity-80`}
                                            title="View seen by"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const mid = Number(msg.id);
                                              if (!mid) return;
                                              setShowReadsForId((cur) => (cur === msg.id ? null : msg.id));
                                              if (!readsCache[mid]) {
                                                fetch(`${API.communication.getGroupMessageReads()}?group_message_id=${mid}`)
                                                  .then((r) => safeJsonParse(r))
                                                  .then((res) => {
                                                    if (!res?.success) return;
                                                    setReadsCache((prev) => ({ ...prev, [mid]: res.data || [] }));
                                                  })
                                                  .catch(() => {});
                                              }
                                            }}
                                          >
                                            <FaEye size={12} />
                                          </button>
                                        </div>
                                      )}
                                      {selectedType === 'group' && showReadsForId === msg.id && (
                                        <div
                                          className={`absolute top-full mt-2 ${isSelf ? 'right-0' : 'left-0'} w-80 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-2xl p-3 z-[9999]`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="font-semibold text-gray-800 mb-2">Seen by</div>
                                          {(() => {
                                            const list = readsCache[Number(msg.id)] || [];
                                            if (!list.length) return <div className="text-gray-500 text-[12px]">No views yet</div>;
                                            return (
                                              <div className="max-h-48 overflow-auto space-y-2 text-[12px]">
                                                {list.map((r, idx) => (
                                                  <div key={idx} className="flex items-start justify-between gap-3">
                                                    <div className="font-medium flex-1 min-w-0 break-words">[{roleBracket(r.user_role)}] {r.full_name}</div>
                                                    <div className="text-gray-500 whitespace-nowrap">{formatDateTime(r.read_at)}</div>
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {/* Tail */}
                                  <div className={`absolute bottom-0 ${isSelf ? "right-0 translate-x-2" : "left-0 -translate-x-2"} w-3 h-3 rotate-45 ${isSelf ? "bg-[#1E2A79]" : "bg-white border-b border-r border-gray-200"
                                    }`}></div>
                                </div>
                                <div className={`flex items-center gap-2 text-[12px] mt-1 ${isSelf ? "justify-end text-gray-400" : "justify-start text-gray-500"}`}>
                                  <span>{formatSmartTime(msg.time)}</span>
                                  {selectedType !== 'group' && isSelf && msg.isRead && (
                                    <span title="Seen" className="inline-flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}

                    {/* Fixed Input Bar */}
                    <div className="relative z-10 px-4 sm:px-6 py-3 border-t bg-white flex flex-col gap-2 sm:gap-3 min-w-0">
                      {selectedType !== 'archived' && (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                          {getQuickReplies(selectedType, selectedChat).map((qr, idx) => (
                            <button key={idx} onClick={() => setInput((prev) => (prev ? (prev.endsWith(' ') ? prev + qr : prev + ' ' + qr) : qr))} className="px-3 py-1 rounded-full text-xs bg-blue-50 text-[#1E2A79] border border-blue-200 hover:bg-blue-100 whitespace-nowrap" title={qr}>
                              {qr}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedType === 'archived' ? (
                        <div className="flex-1 text-center text-sm text-gray-500 py-2">This conversation is archived. You can't send, edit, or unsend messages.</div>
                      ) : (
                        <div className="flex items-end gap-2 sm:gap-3 min-w-0">
                          <textarea
                            rows={1}
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => {
                              setInput(e.target.value);
                              const el = composerRef.current;
                              if (el) {
                                el.style.height = 'auto';
                                const maxH = 180;
                                el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
                                el.scrollTop = el.scrollHeight;
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none min-h-[44px] max-h-[180px] caret-[#1E2A79] placeholder:text-gray-400 leading-5 w-full"
                            ref={composerRef}
                          />
                          <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className={`px-4 py-2 rounded-full flex items-center gap-2 text-white transition ${input.trim() ? "bg-[#28316c] hover:bg-[#1f2656]" : "bg-gray-300 cursor-not-allowed"
                              }`}
                          >
                            <span className="text-sm">Send</span>
                            <FaPaperPlane size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[420px] max-w-[98vw] w-[520px] relative border border-gray-100">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Archive Conversation</h3>
              <p className="text-gray-600 text-sm">This action cannot be undone</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Archive Confirmation</h4>
                  <p className="text-sm text-gray-700">
                    Are you sure you want to archive this conversation with <span className="font-semibold">{selectedChat?.name}</span>? This will set all messages between you and this user as archived. You can still view them in the Archive tab.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                onClick={() => setShowArchiveModal(false)}
                disabled={archiving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${archiving ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none' : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                onClick={async () => {
                  try {
                    setArchiving(true);
                    const uid = Number(localStorage.getItem('userId'));
                    const partnerId = Number(selectedChat?.id);
                    const res = await fetch(API.communication.archiveConversation(), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user_id: uid, partner_id: partnerId })
                    });
                    const json = await safeJsonParse(res);
                    if (!json?.success) throw new Error(json?.error || 'Failed to archive');
                    // Clear from active chat view
                    setChats((prev) => prev.map((c) => (c.id === selectedChat?.id ? { ...c, messages: [], lastMessage: '', lastMessageAt: null } : c)));
                    // Remove from recents
                    setRecent((prev) => prev.filter((r) => r.id !== String(partnerId)));
                    // Refresh archived list
                    fetch(`${API.communication.getArchivedConversations()}?user_id=${uid}`)
                      .then((r) => safeJsonParse(r))
                      .then((arch) => {
                        if (arch?.success) {
                          const mapped = (arch.data || []).map((u) => {
                            const name = [u.user_firstname, u.user_middlename, u.user_lastname].filter(Boolean).join(" ");
                            return {
                              id: String(u.user_id),
                              name,
                              color: roleColorClass(u.user_role),
                              role: Number(u.user_role),
                              unread: 0,
                              lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
                              messages: [],
                              archived: true,
                              photo: u.user_photo || null,
                            };
                          });
                          setArchived(mapped);
                          
                          // Store photos in UserContext for global access
                          (arch.data || []).forEach((u) => {
                            if (u.user_photo) {
                              updateAnyUserPhoto(String(u.user_id), u.user_photo);
                              setUserPhotos(prev => ({ ...prev, [String(u.user_id)]: u.user_photo }));
                            }
                          });
                        }
                      });
                    setShowArchiveModal(false);
                    try { toast.success('Conversation archived successfully'); } catch (e) { }
                  } catch (e) {
                    console.error(e);
                    try { toast.error('Failed to archive conversation'); } catch (err) { }
                  } finally {
                    setArchiving(false);
                  }
                }}
                disabled={archiving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal for archived chats */}
      {selectedType === 'archived' && selectedChat && showRestoreModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[420px] max-w-[98vw] w-[520px] relative border border-gray-100">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Restore Conversation</h3>
              <p className="text-gray-600 text-sm">This action cannot be undone</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Confirmation</h4>
                  <p className="text-sm text-green-700">Are you sure you want to restore the conversation with <span className="font-semibold">{selectedChat?.name}</span>? This will move the thread back to Users.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" onClick={() => setShowRestoreModal(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                try {
                  const uid = Number(localStorage.getItem('userId'));
                  const partnerId = Number(selectedChat?.id);
                  const res = await fetch(API.communication.unarchiveConversation(), {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, partner_id: partnerId })
                  });
                  const json = await safeJsonParse(res);
                  if (!json?.success) throw new Error(json?.error || 'Failed to restore');
                  // Refresh recents and archive lists
                  fetch(API.communication.getRecentConversations()).then(r => safeJsonParse(r)).then(rc => {
                    if (rc?.success) {
                      const mapped = (rc.data || []).map((u) => {
                        const name = [u.user_firstname, u.user_middlename, u.user_lastname].filter(Boolean).join(' ');
                        const rawLast = u.last_message || '';
                        const isUnsentText = typeof rawLast === 'string' && rawLast.toLowerCase().includes('unsent a message');
                        const fromSelf = Number(u.last_sender_id || 0) === uid;
                        const normalizedLast = isUnsentText ? (fromSelf ? 'You unsent a message' : `${name} unsent a message`) : (fromSelf && rawLast ? `You: ${rawLast}` : rawLast);
                        return {
                          id: String(u.user_id),
                          name,
                          color: roleColorClass(u.user_role),
                          role: Number(u.user_role),
                          unread: 0,
                          lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
                          lastMessage: normalizedLast,
                          messages: [],
                          photo: u.user_photo || null,
                        };
                      });
                      setRecent(mapped);
                      
                      // Store photos in UserContext for global access
                      (rc.data || []).forEach((u) => {
                        if (u.user_photo) {
                          updateAnyUserPhoto(String(u.user_id), u.user_photo);
                          setUserPhotos(prev => ({ ...prev, [String(u.user_id)]: u.user_photo }));
                        }
                      });
                    }
                  });
                  fetch(`${API.communication.getArchivedConversations()}?user_id=${uid}`).then(r => safeJsonParse(r)).then(ar => {
                    if (ar?.success) {
                      const mapped = (ar.data || []).map((u) => ({
                        id: String(u.user_id),
                        name: [u.user_firstname, u.user_middlename, u.user_lastname].filter(Boolean).join(' '),
                        color: roleColorClass(u.user_role),
                        role: Number(u.user_role),
                        unread: 0,
                        lastMessageAt: u.last_sent_at ? new Date(u.last_sent_at) : null,
                        messages: [],
                        archived: true,
                        photo: u.user_photo || null,
                      }));
                      setArchived(mapped);
                      
                      // Store photos in UserContext for global access
                      (ar.data || []).forEach((u) => {
                        if (u.user_photo) {
                          updateAnyUserPhoto(String(u.user_id), u.user_photo);
                          setUserPhotos(prev => ({ ...prev, [String(u.user_id)]: u.user_photo }));
                        }
                      });
                    }
                  });
                  setShowRestoreModal(false);
                  try { toast.success('Conversation restored'); } catch (e) { }
                } catch (e) {
                  console.error(e);
                  try { toast.error('Failed to restore'); } catch (err) { }
                }
              }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}