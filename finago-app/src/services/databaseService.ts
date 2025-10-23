/**
 * Database Service for Modal Content Management
 * Handles communication with the backend database API
 */

const API_BASE_URL = process.env.REACT_APP_DATABASE_API_URL;
const API_TIMEOUT = parseInt(process.env.REACT_APP_DATABASE_API_TIMEOUT || '30000');

export interface ModalContent {
  title: string;
  content: string;
  tableRows?: any[];
  validation?: any;
  timestamp?: string;
}

export interface DocumentModalData {
  [modalId: string]: ModalContent;
}

export interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get all modal content for a specific document and user
 */
export const getModalsByDocAndUser = async (docId: string, userId: string = 'default'): Promise<DatabaseResponse<DocumentModalData>> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/modals/${encodeURIComponent(docId)}/${encodeURIComponent(userId)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data: data.modals || {} };
  } catch (error) {
    console.error('Error fetching modals:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Update a specific modal's content
 */
export const updateModalContent = async (
  docId: string, 
  modalId: string, 
  content: ModalContent, 
  userId: string = 'default'
): Promise<DatabaseResponse> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/modal/${encodeURIComponent(docId)}/${encodeURIComponent(userId)}/${encodeURIComponent(modalId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(content),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating modal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update modal content' 
    };
  }
};

/**
 * Create a new document entry in database
 */
export const createDocumentEntry = async (docId: string, userId: string = 'default'): Promise<DatabaseResponse> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/modals/${encodeURIComponent(docId)}/${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating document entry:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create document entry' 
    };
  }
};

/**
 * Initialize document with all parsed modal data
 */
export const initializeDocumentWithParsedData = async (
  docId: string, 
  parsedModalData: DocumentModalData,
  userId: string = 'default'
): Promise<DatabaseResponse> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/initialize-document`,
      {
        method: 'POST',
        body: JSON.stringify({
          docId,
          userId,
          modalData: parsedModalData
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error initializing document with parsed data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initialize document with parsed data' 
    };
  }
};

/**
 * Get fresh modal content for chat (webhook endpoint)
 */
export const getModalContentForChat = async (docId: string, userId: string = 'default'): Promise<DatabaseResponse<DocumentModalData>> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/webhook/chat-modals`,
      {
        method: 'POST',
        body: JSON.stringify({ docId, userId }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data: data.allModalsContent || {} };
  } catch (error) {
    console.error('Error fetching chat modal content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get modal content for chat' 
    };
  }
};

/**
 * Health check for database service
 */
export const checkDatabaseHealth = async (): Promise<DatabaseResponse> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 3000);
    
    if (!response.ok) {
      throw new Error(`Database service unhealthy: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database service unavailable' 
    };
  }
};

/**
 * Debug: Log database service status
 */
export const logDatabaseStatus = async (): Promise<void> => {
  if (process.env.REACT_APP_DEBUG_MODE === 'true') {
    const health = await checkDatabaseHealth();
    console.log('🔗 Database Service Status:', health);
  }
};

export default {
  getModalsByDocAndUser,
  updateModalContent,
  createDocumentEntry,
  initializeDocumentWithParsedData,
  getModalContentForChat,
  checkDatabaseHealth,
  logDatabaseStatus
};
