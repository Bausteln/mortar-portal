import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ProxyRulesList from './components/ProxyRulesList'
import ProxyRuleForm from './components/ProxyRuleForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>Mortar Portal</h1>
          <nav>
            <Link to="/">Proxy Rules</Link>
            <Link to="/create">Create Rule</Link>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<ProxyRulesList />} />
            <Route path="/create" element={<ProxyRuleForm />} />
            <Route path="/edit/:name" element={<ProxyRuleForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
