import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
          <h1>Mortar Portal</h1>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>
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
