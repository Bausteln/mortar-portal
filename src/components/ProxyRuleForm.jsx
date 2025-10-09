import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Fuse from 'fuse.js'
import { proxyRulesApi } from '../api/client'
import INGRESS_ANNOTATIONS from '../data/ingressAnnotations.json'
import {
  validateName,
  validateDomain,
  validateDestination,
  validatePort,
  validateNameUnique,
  validateDomainUnique,
  validateProxyRuleForm,
  hasValidationErrors
} from '../utils/validation'
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
  const [annotations, setAnnotations] = useState({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})
  const [existingRules, setExistingRules] = useState([])
  const [loadingRules, setLoadingRules] = useState(true)

  useEffect(() => {
    fetchAllRules()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      fetchRule()
    }
  }, [editName])

  const fetchAllRules = async () => {
    try {
      setLoadingRules(true)
      const response = await proxyRulesApi.getAll()
      setExistingRules(response.items || [])
    } catch (err) {
      console.error('Error fetching existing rules:', err)
      // Don't show error to user, duplicate checking is a nice-to-have
    } finally {
      setLoadingRules(false)
    }
  }

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
      setAnnotations(rule.spec?.annotations || {})
      if (rule.spec?.annotations && Object.keys(rule.spec.annotations).length > 0) {
        setShowAdvanced(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const validateField = (fieldName, value) => {
    let error = null

    switch (fieldName) {
      case 'name':
        error = validateName(value)
        // Check for duplicate name only in create mode
        if (!error && !isEditMode && existingRules.length > 0) {
          error = validateNameUnique(value, existingRules, editName)
        }
        break
      case 'domain':
        error = validateDomain(value)
        // Check for duplicate domain
        if (!error && existingRules.length > 0) {
          error = validateDomainUnique(value, existingRules, editName)
        }
        break
      case 'destination':
        error = validateDestination(value)
        break
      case 'port':
        error = validatePort(value)
        break
      default:
        break
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }))

    return error
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    // Validate field if it has been touched
    if (touchedFields[name]) {
      validateField(name, newValue)
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }))

    // Validate on blur
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouchedFields({
      name: true,
      domain: true,
      destination: true,
      port: true,
    })

    // Validate all fields
    const errors = validateProxyRuleForm(formData, existingRules, isEditMode ? editName : null)
    setValidationErrors(errors)

    // Don't submit if there are validation errors
    if (hasValidationErrors(errors)) {
      setError('Please fix the validation errors before submitting')
      return
    }

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

      // Include annotations if any are set
      if (Object.keys(annotations).length > 0) {
        spec.annotations = annotations
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

  const addAnnotation = (key) => {
    const annotation = INGRESS_ANNOTATIONS.find(a => a.key === key)
    setAnnotations(prev => ({
      ...prev,
      [key]: annotation?.example || ''
    }))
    setSearchTerm('')
  }

  const removeAnnotation = (key) => {
    setAnnotations(prev => {
      const newAnnotations = { ...prev }
      delete newAnnotations[key]
      return newAnnotations
    })
  }

  const updateAnnotationValue = (key, value) => {
    setAnnotations(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Filter out already added annotations
  const availableAnnotations = useMemo(() =>
    INGRESS_ANNOTATIONS.filter(annotation => !annotations[annotation.key]),
    [annotations]
  )

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() =>
    new Fuse(availableAnnotations, {
      keys: ['key', 'description', 'type'],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
    }),
    [availableAnnotations]
  )

  // Get filtered annotations based on search term
  const filteredAnnotations = useMemo(() => {
    if (!searchTerm) {
      return availableAnnotations
    }
    return fuse.search(searchTerm).map(result => result.item)
  }, [searchTerm, availableAnnotations, fuse])

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
            onBlur={handleBlur}
            disabled={isEditMode}
            required
            placeholder="my-proxy-rule"
            className={validationErrors.name && touchedFields.name ? 'error' : ''}
          />
          {validationErrors.name && touchedFields.name && (
            <small className="error-text">{validationErrors.name}</small>
          )}
          {isEditMode && !validationErrors.name && (
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
            onBlur={handleBlur}
            required
            placeholder="example.com"
            className={validationErrors.domain && touchedFields.domain ? 'error' : ''}
          />
          {validationErrors.domain && touchedFields.domain && (
            <small className="error-text">{validationErrors.domain}</small>
          )}
          {!validationErrors.domain && (
            <small className="help-text">The domain to proxy</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            placeholder="10.0.0.50"
            className={validationErrors.destination && touchedFields.destination ? 'error' : ''}
          />
          {validationErrors.destination && touchedFields.destination && (
            <small className="error-text">{validationErrors.destination}</small>
          )}
          {!validationErrors.destination && (
            <small className="help-text">The destination IP or hostname to route traffic to</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="port">Port</label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="3000"
            className={validationErrors.port && touchedFields.port ? 'error' : ''}
          />
          {validationErrors.port && touchedFields.port && (
            <small className="error-text">{validationErrors.port}</small>
          )}
          {!validationErrors.port && (
            <small className="help-text">Optional: The destination port (leave empty for default)</small>
          )}
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

        {/* Advanced Annotations Section */}
        <div className="advanced-section">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} Advanced: Ingress Annotations
            {Object.keys(annotations).length > 0 && (
              <span className="annotation-count">({Object.keys(annotations).length})</span>
            )}
          </button>

          {showAdvanced && (
            <div className="advanced-content">
              <small className="help-text" style={{ marginBottom: '1rem', display: 'block' }}>
                Configure nginx ingress controller behavior using annotations. Search and add annotations below.
              </small>

              {/* Current Annotations */}
              {Object.keys(annotations).length > 0 && (
                <div className="current-annotations">
                  <h4>Active Annotations</h4>
                  {Object.entries(annotations).map(([key, value]) => {
                    const annotation = INGRESS_ANNOTATIONS.find(a => a.key === key)
                    return (
                      <div key={key} className="annotation-item">
                        <div className="annotation-header">
                          <label className="annotation-key">{key}</label>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeAnnotation(key)}
                            title="Remove annotation"
                          >
                            ✕
                          </button>
                        </div>
                        {annotation && (
                          <small className="annotation-description">{annotation.description}</small>
                        )}
                        <input
                          type="text"
                          className="annotation-value"
                          value={value}
                          onChange={(e) => updateAnnotationValue(key, e.target.value)}
                          placeholder={annotation?.example || 'Enter value'}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Search and Add Annotations */}
              <div className="add-annotation-section">
                <h4>Add Annotation</h4>
                <input
                  type="text"
                  className="annotation-search"
                  placeholder="Search annotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="annotation-suggestions">
                  {filteredAnnotations.length > 0 ? (
                    filteredAnnotations.map(annotation => (
                      <div
                        key={annotation.key}
                        className="suggestion-item"
                        onClick={() => addAnnotation(annotation.key)}
                      >
                        <div className="suggestion-key">{annotation.key}</div>
                        <div className="suggestion-description">{annotation.description}</div>
                        <div className="suggestion-example">Example: {annotation.example}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      {searchTerm ? 'No matching annotations found' : 'All annotations have been added'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
