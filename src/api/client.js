const API_BASE = '/api'

/**
 * Extracts error message from response
 */
async function getErrorMessage(response) {
  try {
    const text = await response.text()
    // Backend returns plain text error messages
    return text || `Request failed with status ${response.status}`
  } catch (e) {
    return `Request failed with status ${response.status}`
  }
}

export const proxyRulesApi = {
  // Get all proxy rules
  getAll: async () => {
    const response = await fetch(`${API_BASE}/proxyrules`)
    if (!response.ok) {
      const errorMsg = await getErrorMessage(response)
      throw new Error(errorMsg)
    }
    return response.json()
  },

  // Get a single proxy rule by name
  getOne: async (name) => {
    const response = await fetch(`${API_BASE}/proxyrules/${name}`)
    if (!response.ok) {
      const errorMsg = await getErrorMessage(response)
      throw new Error(errorMsg)
    }
    return response.json()
  },

  // Create a new proxy rule
  create: async (rule) => {
    const response = await fetch(`${API_BASE}/proxyrules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
    })
    if (!response.ok) {
      const errorMsg = await getErrorMessage(response)
      throw new Error(errorMsg)
    }
    return response.json()
  },

  // Update an existing proxy rule
  update: async (name, rule) => {
    const response = await fetch(`${API_BASE}/proxyrules/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
    })
    if (!response.ok) {
      const errorMsg = await getErrorMessage(response)
      throw new Error(errorMsg)
    }
    return response.json()
  },

  // Delete a proxy rule
  delete: async (name) => {
    const response = await fetch(`${API_BASE}/proxyrules/${name}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const errorMsg = await getErrorMessage(response)
      throw new Error(errorMsg)
    }
  },
}

export const ingressesApi = {
  // Get all ingresses (read-only)
  getAll: async () => {
    const response = await fetch(`${API_BASE}/ingresses`)
    if (!response.ok) {
      throw new Error('Failed to fetch ingresses')
    }
    return response.json()
  },
}
