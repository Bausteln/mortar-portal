import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { proxyRulesApi } from '../api/client'
import './ProxyRuleForm.css'

function ProxyRuleForm() {
  const { name: editName } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!editName

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    destination: '',
    port: '',
    tls: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEditMode) {
      fetchRule()
    }
  }, [editName])

  const fetchRule = async () => {
    try {
      setLoading(true)
      setError(null)
      const rule = await proxyRulesApi.getOne(editName)
      setFormData({
        name: rule.metadata.name || '',
        domain: rule.spec?.domain || '',
        destination: rule.spec?.destination || '',
        port: rule.spec?.port || '',
        tls: rule.spec?.tls !== undefined ? rule.spec.tls : true,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const spec = {
        domain: formData.domain,
        destination: formData.destination,
        tls: formData.tls,
      }

      // Only include port if it's provided
      if (formData.port) {
        spec.port = parseInt(formData.port, 10)
      }

      const ruleData = {
        apiVersion: 'bausteln.io/v1',
        kind: 'Proxyrule',
        metadata: {
          name: formData.name,
        },
        spec,
      }

      if (isEditMode) {
        await proxyRulesApi.update(editName, ruleData)
      } else {
        await proxyRulesApi.create(ruleData)
      }

      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEditMode) {
    return <div className="loading">Loading rule...</div>
  }

  return (
    <div className="proxy-rule-form">
      <h2>{isEditMode ? 'Edit Proxy Rule' : 'Create Proxy Rule'}</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isEditMode}
            required
            placeholder="my-proxy-rule"
          />
          {isEditMode && (
            <small className="help-text">Name cannot be changed in edit mode</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="domain">Domain</label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            required
            placeholder="example.com"
          />
          <small className="help-text">The domain to proxy</small>
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
            placeholder="10.0.0.50"
          />
          <small className="help-text">The destination IP or hostname to route traffic to</small>
        </div>

        <div className="form-group">
          <label htmlFor="port">Port</label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            placeholder="3000"
          />
          <small className="help-text">Optional: The destination port (leave empty for default)</small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="tls"
              checked={formData.tls}
              onChange={handleChange}
            />
            <span>Enable TLS</span>
          </label>
          <small className="help-text">Enable TLS for the proxy (default: true)</small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProxyRuleForm
