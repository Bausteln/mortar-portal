import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { proxyRulesApi, ingressesApi } from '../api/client'
import './ResourcesList.css'

const FILTER_ALL = 'all'
const FILTER_PROXY_RULES = 'proxyrules'
const FILTER_INGRESSES = 'ingresses'

function ResourcesList() {
  const [proxyRules, setProxyRules] = useState([])
  const [ingresses, setIngresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState(FILTER_ALL)
  const navigate = useNavigate()

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)

      const [proxyRulesData, ingressesData] = await Promise.all([
        proxyRulesApi.getAll(),
        ingressesApi.getAll(),
      ])

      setProxyRules(proxyRulesData.items || [])
      setIngresses(ingressesData.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (name) => {
    if (!confirm(`Are you sure you want to delete the proxy rule "${name}"?`)) {
      return
    }

    try {
      await proxyRulesApi.delete(name)
      await fetchResources()
    } catch (err) {
      alert(`Failed to delete rule: ${err.message}`)
    }
  }

  const handleEdit = (name) => {
    navigate(`/edit/${name}`)
  }

  const filterBySearch = (items, type) => {
    if (!searchQuery.trim()) {
      return items
    }

    const query = searchQuery.toLowerCase()
    return items.filter(item => {
      const name = item.metadata?.name?.toLowerCase() || ''
      const namespace = item.metadata?.namespace?.toLowerCase() || ''

      if (type === 'proxyrule') {
        const domain = item.spec?.domain?.toLowerCase() || ''
        const destination = item.spec?.destination?.toLowerCase() || ''
        return name.includes(query) || domain.includes(query) || destination.includes(query) || namespace.includes(query)
      } else if (type === 'ingress') {
        const host = item.spec?.rules?.[0]?.host?.toLowerCase() || ''
        return name.includes(query) || host.includes(query) || namespace.includes(query)
      }

      return name.includes(query) || namespace.includes(query)
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

  const renderProxyRuleCard = (rule) => (
    <div key={`proxyrule-${rule.metadata.name}`} className="rule-card">
      <div className="rule-header">
        <div className="rule-title">
          <div className="title-row">
            <h3>{rule.metadata.name}</h3>
            <span className="resource-type-badge resource-type-proxyrule">Proxy Rule</span>
          </div>
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
        {rule.metadata.namespace && (
          <p><strong>Namespace:</strong> {rule.metadata.namespace}</p>
        )}
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
  )

  const renderIngressCard = (ingress) => {
    const host = ingress.spec?.rules?.[0]?.host || 'N/A'
    const ingressClassName = ingress.spec?.ingressClassName || 'N/A'
    const hasTLS = ingress.spec?.tls && ingress.spec.tls.length > 0

    return (
      <div key={`ingress-${ingress.metadata.namespace}-${ingress.metadata.name}`} className="rule-card ingress-card">
        <div className="rule-header">
          <div className="rule-title">
            <div className="title-row">
              <h3>{ingress.metadata.name}</h3>
              <span className="resource-type-badge resource-type-ingress">Ingress</span>
            </div>
            <span className="status-badge status-readonly">Read Only</span>
          </div>
        </div>
        <div className="rule-details">
          <p><strong>Namespace:</strong> {ingress.metadata.namespace}</p>
          <p><strong>Host:</strong> {host}</p>
          <p><strong>Ingress Class:</strong> {ingressClassName}</p>
          <p><strong>TLS:</strong> {hasTLS ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading resources...</div>
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={fetchResources}>Retry</button>
      </div>
    )
  }

  const filteredProxyRules = filter === FILTER_INGRESSES ? [] : filterBySearch(proxyRules, 'proxyrule')
  const filteredIngresses = filter === FILTER_PROXY_RULES ? [] : filterBySearch(ingresses, 'ingress')
  const totalFiltered = filteredProxyRules.length + filteredIngresses.length
  const totalResources = (filter === FILTER_ALL ? proxyRules.length + ingresses.length :
                          filter === FILTER_PROXY_RULES ? proxyRules.length :
                          ingresses.length)

  return (
    <div className="resources-list">
      <div className="list-header">
        <h2>Resources</h2>
        <button onClick={fetchResources} className="btn-refresh">Refresh</button>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === FILTER_ALL ? 'active' : ''}`}
          onClick={() => setFilter(FILTER_ALL)}
        >
          All ({proxyRules.length + ingresses.length})
        </button>
        <button
          className={`filter-tab ${filter === FILTER_PROXY_RULES ? 'active' : ''}`}
          onClick={() => setFilter(FILTER_PROXY_RULES)}
        >
          Proxy Rules ({proxyRules.length})
        </button>
        <button
          className={`filter-tab ${filter === FILTER_INGRESSES ? 'active' : ''}`}
          onClick={() => setFilter(FILTER_INGRESSES)}
        >
          Ingresses ({ingresses.length})
        </button>
      </div>

      {totalResources > 0 && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, domain, host, or namespace..."
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

      {totalResources === 0 ? (
        <p className="empty-state">No resources found.</p>
      ) : totalFiltered === 0 ? (
        <p className="empty-state">No resources match your search query.</p>
      ) : (
        <div className="rules-grid">
          {filteredProxyRules.map(renderProxyRuleCard)}
          {filteredIngresses.map(renderIngressCard)}
        </div>
      )}
    </div>
  )
}

export default ResourcesList
