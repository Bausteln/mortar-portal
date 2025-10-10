import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { proxyRulesApi } from '../api/client'
import './ProxyRulesList.css'

function ProxyRulesList() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await proxyRulesApi.getAll()
      setRules(data.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (name) => {
    if (!confirm(`Are you sure you want to delete the rule "${name}"?`)) {
      return
    }

    try {
      await proxyRulesApi.delete(name)
      await fetchRules()
    } catch (err) {
      alert(`Failed to delete rule: ${err.message}`)
    }
  }

  const handleEdit = (name) => {
    navigate(`/edit/${name}`)
  }

  const filterRules = (rules) => {
    if (!searchQuery.trim()) {
      return rules
    }

    const query = searchQuery.toLowerCase()
    return rules.filter(rule => {
      const name = rule.metadata?.name?.toLowerCase() || ''
      const domain = rule.spec?.domain?.toLowerCase() || ''
      const destination = rule.spec?.destination?.toLowerCase() || ''

      // Check if destinations array contains the query
      let destinationsMatch = false
      if (rule.spec?.destinations && Array.isArray(rule.spec.destinations)) {
        destinationsMatch = rule.spec.destinations.some(dest =>
          dest.toLowerCase().includes(query)
        )
      }

      return name.includes(query) || domain.includes(query) || destination.includes(query) || destinationsMatch
    })
  }

  const getStatusBadge = (rule) => {
    if (!rule.status?.conditions) {
      return <span className="status-badge status-unknown">Unknown</span>
    }

    const readyCondition = rule.status.conditions.find(c => c.type === 'Ready')
    const syncedCondition = rule.status.conditions.find(c => c.type === 'Synced')

    if (readyCondition?.status === 'True' && syncedCondition?.status === 'True') {
      return (
        <span className="status-badge status-healthy" title={`Ready: ${readyCondition.reason}\nSynced: ${syncedCondition.reason}`}>
          Healthy
        </span>
      )
    }

    if (syncedCondition?.status === 'False' || readyCondition?.status === 'False') {
      const failedCondition = readyCondition?.status === 'False' ? readyCondition : syncedCondition
      return (
        <span className="status-badge status-unhealthy" title={`${failedCondition.type}: ${failedCondition.reason}`}>
          Unhealthy
        </span>
      )
    }

    return (
      <span className="status-badge status-pending">
        Pending
      </span>
    )
  }

  if (loading) {
    return <div className="loading">Loading proxy rules...</div>
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={fetchRules}>Retry</button>
      </div>
    )
  }

  const filteredRules = filterRules(rules)

  return (
    <div className="proxy-rules-list">
      <div className="list-header">
        <h2>Proxy Rules</h2>
        <button onClick={fetchRules} className="btn-refresh">Refresh</button>
      </div>

      {rules.length > 0 && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, domain, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-clear-search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {rules.length === 0 ? (
        <p className="empty-state">No proxy rules found. Create one to get started.</p>
      ) : filteredRules.length === 0 ? (
        <p className="empty-state">No rules match your search query.</p>
      ) : (
        <div className="rules-grid">
          {filteredRules.map((rule) => (
            <div key={rule.metadata.name} className="rule-card">
              <div className="rule-header">
                <div className="rule-title">
                  <h3>{rule.metadata.name}</h3>
                  {getStatusBadge(rule)}
                </div>
                <div className="rule-actions">
                  <button
                    onClick={() => handleEdit(rule.metadata.name)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rule.metadata.name)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="rule-details">
                {rule.spec && (
                  <>
                    {rule.spec.domain && <p><strong>Domain:</strong> {rule.spec.domain}</p>}
                    {rule.spec.destinations && Array.isArray(rule.spec.destinations) && rule.spec.destinations.length > 0 ? (
                      <p>
                        <strong>Destinations:</strong>{' '}
                        {rule.spec.destinations.join(', ')}
                        {rule.spec.destinations.length > 1 && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#666' }}>
                            ({rule.spec.destinations.length} endpoints)
                          </span>
                        )}
                      </p>
                    ) : rule.spec.destination && (
                      <p><strong>Destination:</strong> {rule.spec.destination}</p>
                    )}
                    {rule.spec.port && <p><strong>Port:</strong> {rule.spec.port}</p>}
                    <p><strong>TLS:</strong> {rule.spec.tls ? 'Enabled' : 'Disabled'}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProxyRulesList
