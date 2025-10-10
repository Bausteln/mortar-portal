import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import ResourcesList from './components/ResourcesList'
import ProxyRuleForm from './components/ProxyRuleForm'
import { useTheme } from './context/ThemeContext'
import logo from './assets/logo.svg'
import './App.css'

function Header() {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  return (
    <header className="header">
      <div className="logo-container" onClick={handleLogoClick}>
        <img src={logo} alt="Bausteln Logo" className="logo" />
        <h1 className="logo-text">Mortar</h1>
      </div>
      <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  )
}

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<ResourcesList />} />
            <Route path="/create" element={<ProxyRuleForm />} />
            <Route path="/edit/:name" element={<ProxyRuleForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
