// SSE Configuration for Real-time Messaging
// This file handles backend URL configuration for both local and production environments
import { API_URL } from './api.js';

const getBackendUrl = () => {
  // Use the same API configuration as the main API
  return API_URL.replace('/backend-ville', '').replace('/capstone-project/backend', '');
};

const getSSEUrl = (userId, lastCheck) => {
  const backendUrl = getBackendUrl();
  // Use the same path logic as the main API
  const backendPath = API_URL.includes('learnersville.online') ? '/backend' : '/capstone-project/backend';
  return `${backendUrl}${backendPath}/Communication/sse_messages.php?user_id=${userId}&last_check=${lastCheck}`;
};

export { getBackendUrl, getSSEUrl };
