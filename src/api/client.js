const API_BASE = '/api'

export const proxyRulesApi = {
  // Get all proxy rules
  getAll: async () => {
    const response = await fetch(`${API_BASE}/proxyrules`)
    if (!response.ok) {
      throw new Error('Failed to fetch proxy rules')
    }
    return response.json()
  },

  // Get a single proxy rule by name
  getOne: async (name) => {
    const response = await fetch(`${API_BASE}/proxyrules/${name}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch proxy rule: ${name}`)
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
      throw new Error('Failed to create proxy rule')
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
      throw new Error('Failed to update proxy rule')
    }
    return response.json()
  },

  // Delete a proxy rule
  delete: async (name) => {
    const response = await fetch(`${API_BASE}/proxyrules/${name}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete proxy rule')
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
