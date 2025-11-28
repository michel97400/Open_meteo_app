
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Accueil_Page from './pages/Accueil';
import Formulaire_Api from './pages/api_form';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Accueil_Page />} />
        <Route path="/formulaire" element={<Formulaire_Api />} />
      </Routes>
    </Router>
  );
}

export default App
