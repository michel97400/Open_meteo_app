import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';



function Header_template(params) {
    return (<>
        <div className='header-container'>
            <nav>
                <h1>Open Météo API</h1>
                <ul>
                    <li><Link to={'/'}>Accueil</Link></li>
                    <li><Link to={'/formulaire'}>Prévisions cycloniques</Link></li>
                </ul>
            </nav>
        </div>
    </>)
}

export default Header_template;