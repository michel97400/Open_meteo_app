import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';



function Header_template(params) {
    return (<>
        <div>
            <nav>
                <ul>
                    <li><Link to={'/'}>Accueil</Link></li>
                    <li><Link to={'/formulaire'}>Prévisions Cyclones</Link></li>
                </ul>
            </nav>
        </div>
    </>)
}

export default Header_template;