import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { proxyRulesApi } from '../api/client'
import './ProxyRulesList.css'

function ProxyRulesList() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  return (
    <div className="proxy-rules-list">
      <div className="list-header">
        <h2>Proxy Rules</h2>
        <button onClick={fetchRules} className="btn-refresh">Refresh</button>
      </div>

      {rules.length === 0 ? (
        <p className="empty-state">No proxy rules found. Create one to get started.</p>
      ) : (
        <div className="rules-grid">
          {rules.map((rule) => (
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
                    {rule.spec.destination && (
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
