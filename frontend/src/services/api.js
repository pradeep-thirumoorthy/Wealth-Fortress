const API_BASE_URL = '/api';

export const fetchPortfolio = async () => {
  const response = await fetch(`${API_BASE_URL}/portfolio`);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
  }
  return response.json();
};

export const addHolding = async (holding) => {
  const response = await fetch(`${API_BASE_URL}/portfolio/holdings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holding),
  });
  if (!response.ok) {
    throw new Error(`Failed to add holding: ${response.statusText}`);
  }
  return response.json();
};

export const updateHolding = async (ticker, holding) => {
  const response = await fetch(`${API_BASE_URL}/portfolio/holdings/${ticker}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holding),
  });
  if (!response.ok) {
    throw new Error(`Failed to update holding: ${response.statusText}`);
  }
  return response.json();
};

export const deleteHolding = async (ticker) => {
  const response = await fetch(`${API_BASE_URL}/portfolio/holdings/${ticker}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete holding: ${response.statusText}`);
  }
  return response.json();
};

export const triggerScrape = async (ticker, force = true) => {
  const response = await fetch(`${API_BASE_URL}/scrape/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, force }),
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger scrape: ${response.statusText}`);
  }
  return response.json();
};

export const fetchAIInsights = async () => {
  const response = await fetch(`${API_BASE_URL}/insights`);
  if (!response.ok) {
    throw new Error(`Failed to fetch AI insights: ${response.statusText}`);
  }
  return response.json();
};

export const sendAiChatMessage = async (messages, selectedTicker = null) => {
  const response = await fetch(`${API_BASE_URL}/insights/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, selected_ticker: selectedTicker }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send chat message: ${response.statusText}`);
  }
  return response.json();
};
