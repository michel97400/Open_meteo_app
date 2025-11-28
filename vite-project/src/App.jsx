
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Accueil_Page from './pages/Accueil';
import Formulaire_Api from './pages/api_form';
import Header_template from './templates/header';

function App() {
  return (
    <Router>
      <Header_template />
      <Routes>
        <Route path="/" element={<Accueil_Page />} />
        <Route path="/formulaire" element={<Formulaire_Api />} />
      </Routes>
    </Router>
  );
}

export default App
