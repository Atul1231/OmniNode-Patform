/**
 * OmniNode API Service Layer
 * 
 * Centralized HTTP abstraction for all REST API calls to the backend.
 * Reads the JWT token from localStorage and attaches it as Authorization header.
 */

const API_BASE_URL = 'http://localhost:5000';

// TODO: FUTURE_EXPANSION_HOOKS — Replace hardcoded URL with environment variable (VITE_API_URL)
// TODO: FUTURE_EXPANSION_HOOKS — AI auto-response trigger endpoint
// TODO: FUTURE_EXPANSION_HOOKS — Solana wallet verification endpoint
// TODO: FUTURE_EXPANSION_HOOKS — Widget analytics aggregation endpoint

/**
 * Internal helper: builds authenticated fetch headers
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('omninode_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Fetch all conversations for the current agent's organization.
 * Maps the backend response into the frontend Channel interface shape.
 */
export const fetchConversations = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch conversations (${response.status})`);
  }

  const data = await response.json();
  return data.conversations || [];
};

/**
 * Fetch paginated message history for a specific conversation.
 * Returns messages in ascending chronological order.
 */
export const fetchMessages = async (
  conversationId: string, 
  cursor?: string, 
  limit: number = 50
): Promise<{ messages: any[]; nextCursor: string | null }> => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/messages?${params.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch messages (${response.status})`);
  }

  const data = await response.json();
  return {
    messages: data.messages || [],
    nextCursor: data.nextCursor || null
  };
};

/**
 * Fetch the organization details and API key (ADMIN only)
 */
export const fetchOrganizationDetails = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/organization`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch organization details (${response.status})`);
  }

  return response.json();
};

/**
 * Regenerate the API key for the current organization (ADMIN only)
 */
export const rotateApiKey = async (): Promise<{ message: string; apiKey: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/organization/rotate-api-key`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to rotate API key (${response.status})`);
  }

  return response.json();
};
