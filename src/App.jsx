import Dashboard from './Pages/Dashboard.jsx'
import {Routes, Route} from "react-router-dom"
import Layout from './Layout/Layout.jsx'
import Analytics from './Pages/Analytics.jsx'
import Settings from './Pages/Settings.jsx'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
         <Route index element={<Dashboard />}/>
         <Route path="analytics" element={<Analytics />}/>
         <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
