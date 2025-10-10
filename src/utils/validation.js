// Frontend validation utilities that mirror backend validation

const MAX_NAME_LENGTH = 253
const MAX_DOMAIN_LENGTH = 253
const MIN_PORT = 1
const MAX_PORT = 65535

// Regex patterns matching backend validation
const DNS_NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
const K8S_NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/
const IPV4_PATTERN = /^\d+\.\d+\.\d+\.\d+$/

/**
 * Validates an IPv4 address
 */
function isValidIPv4(ip) {
  if (!IPV4_PATTERN.test(ip)) {
    return false
  }

  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * Checks if a string looks like an IPv6 address
 */
function looksLikeIPv6(str) {
  return str.includes(':')
}

/**
 * Validates a Kubernetes resource name
 */
export function validateName(name) {
  if (!name || name.trim() === '') {
    return 'Name is required'
  }

  if (name.length > MAX_NAME_LENGTH) {
    return `Name must not exceed ${MAX_NAME_LENGTH} characters`
  }

  if (!K8S_NAME_REGEX.test(name)) {
    return 'Name must consist of lowercase alphanumeric characters or \'-\', and must start and end with an alphanumeric character'
  }

  return null
}

/**
 * Validates a domain name (including wildcard domains)
 */
export function validateDomain(domain) {
  if (!domain || domain.trim() === '') {
    return 'Domain is required'
  }

  if (domain.length > MAX_DOMAIN_LENGTH) {
    return `Domain must not exceed ${MAX_DOMAIN_LENGTH} characters`
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return 'Domain must not start or end with a dot'
  }

  if (domain.includes('..')) {
    return 'Domain must not contain consecutive dots'
  }

  // Handle wildcard domains (e.g., *.example.com)
  let domainToValidate = domain
  let isWildcard = false
  if (domain.startsWith('*.')) {
    isWildcard = true
    domainToValidate = domain.substring(2) // Remove "*." prefix for validation
  }

  // Wildcard domain must have at least one part after the wildcard
  if (isWildcard && domainToValidate === '') {
    return 'Wildcard domain must be in the format *.example.com'
  }

  const lowerDomain = domainToValidate.toLowerCase()

  if (!DNS_NAME_REGEX.test(lowerDomain)) {
    return 'Domain must be a valid DNS name (lowercase alphanumeric characters, \'-\', and \'.\' only)'
  }

  return null
}

/**
 * Validates a single destination (IP address or DNS name)
 * @param {string} destination - The destination to validate
 * @param {boolean} allowEmpty - Whether empty is allowed (default: false)
 */
export function validateDestination(destination, allowEmpty = false) {
  if (!destination || destination.trim() === '') {
    return allowEmpty ? null : 'Destination is required'
  }

  // Check if it looks like an IPv4 address
  if (IPV4_PATTERN.test(destination)) {
    if (!isValidIPv4(destination)) {
      return 'Destination appears to be an IPv4 address but is invalid (octets must be 0-255)'
    }
    return null // Valid IPv4
  }

  // Check if it looks like IPv6 (basic check)
  if (looksLikeIPv6(destination)) {
    // We'll let the backend do more thorough IPv6 validation
    // Basic check: must have multiple colons
    const colonCount = (destination.match(/:/g) || []).length
    if (colonCount < 2) {
      return 'Destination appears to be an IPv6 address but is invalid'
    }
    return null // Assume valid IPv6 for now
  }

  // Otherwise, validate as DNS name
  const lowerDest = destination.toLowerCase()

  if (!DNS_NAME_REGEX.test(lowerDest)) {
    return 'Destination must be a valid IP address or DNS name'
  }

  if (destination.startsWith('.') || destination.endsWith('.')) {
    return 'Destination must not start or end with a dot'
  }

  if (destination.includes('..')) {
    return 'Destination must not contain consecutive dots'
  }

  return null
}

/**
 * Validates an array of destinations
 * @param {Array<string>} destinations - Array of destinations to validate
 */
export function validateDestinations(destinations) {
  if (!destinations || destinations.length === 0) {
    return 'At least one destination is required'
  }

  // Validate each destination
  for (let i = 0; i < destinations.length; i++) {
    const error = validateDestination(destinations[i], false)
    if (error) {
      return `Destination ${i + 1}: ${error.replace('Destination is required', 'Cannot be empty')}`
    }
  }

  return null
}

/**
 * Validates a port number
 */
export function validatePort(port) {
  // Port is optional, so empty is valid
  if (!port || port === '') {
    return null
  }

  const portNum = parseInt(port, 10)

  if (isNaN(portNum)) {
    return 'Port must be a number'
  }

  if (portNum < MIN_PORT || portNum > MAX_PORT) {
    return `Port must be between ${MIN_PORT} and ${MAX_PORT}`
  }

  return null
}

/**
 * Checks if a name is already in use by another proxy rule
 * @param {string} name - The name to check
 * @param {Array} existingRules - Array of existing proxy rules
 * @param {string} currentName - Current rule name (for edit mode, to exclude self)
 */
export function validateNameUnique(name, existingRules, currentName = null) {
  if (!name || !existingRules) {
    return null
  }

  const duplicate = existingRules.find(rule => {
    const ruleName = rule.metadata?.name
    // Skip the current rule if editing
    if (currentName && ruleName === currentName) {
      return false
    }
    return ruleName === name
  })

  if (duplicate) {
    return `Proxy rule with name '${name}' already exists`
  }

  return null
}

/**
 * Checks if a domain is already in use by another proxy rule
 * @param {string} domain - The domain to check
 * @param {Array} existingRules - Array of existing proxy rules
 * @param {string} currentName - Current rule name (for edit mode, to exclude self)
 */
export function validateDomainUnique(domain, existingRules, currentName = null) {
  if (!domain || !existingRules) {
    return null
  }

  const duplicate = existingRules.find(rule => {
    const ruleName = rule.metadata?.name
    const ruleDomain = rule.spec?.domain

    // Skip the current rule if editing
    if (currentName && ruleName === currentName) {
      return false
    }

    return ruleDomain === domain
  })

  if (duplicate) {
    return `Proxy rule with domain '${domain}' already exists (used by rule '${duplicate.metadata?.name}')`
  }

  return null
}

/**
 * Validates all form fields
 * @param {Object} formData - The form data to validate
 * @param {Array} existingRules - Array of existing proxy rules (optional, for duplicate checking)
 * @param {string} currentName - Current rule name (for edit mode)
 */
export function validateProxyRuleForm(formData, existingRules = null, currentName = null) {
  const errors = {}

  const nameError = validateName(formData.name)
  if (nameError) errors.name = nameError

  // Check for duplicate name (only in create mode)
  if (!nameError && !currentName && existingRules) {
    const uniqueNameError = validateNameUnique(formData.name, existingRules, currentName)
    if (uniqueNameError) errors.name = uniqueNameError
  }

  const domainError = validateDomain(formData.domain)
  if (domainError) errors.domain = domainError

  // Check for duplicate domain
  if (!domainError && existingRules) {
    const uniqueDomainError = validateDomainUnique(formData.domain, existingRules, currentName)
    if (uniqueDomainError) errors.domain = uniqueDomainError
  }

  // Validate destinations (either single destination or array of destinations)
  if (formData.destinations && Array.isArray(formData.destinations) && formData.destinations.length > 0) {
    const destinationsError = validateDestinations(formData.destinations)
    if (destinationsError) errors.destinations = destinationsError
  } else if (formData.destination) {
    const destinationError = validateDestination(formData.destination, false)
    if (destinationError) errors.destination = destinationError
  } else {
    errors.destinations = 'At least one destination is required'
  }

  const portError = validatePort(formData.port)
  if (portError) errors.port = portError

  return errors
}

/**
 * Checks if there are any validation errors
 */
export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0
}
