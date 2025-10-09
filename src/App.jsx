import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ResourcesList from './components/ResourcesList'
import ProxyRuleForm from './components/ProxyRuleForm'
import { useTheme } from './context/ThemeContext'
import './App.css'

function App() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="header-top">
            <h1>Mortar Portal</h1>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
          <nav>
            <Link to="/">Resources</Link>
            <Link to="/create">Create Proxy Rule</Link>
          </nav>
        </header>
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
