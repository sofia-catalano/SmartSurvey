import {Navbar, Nav, Button, Dropdown, DropdownButton} from 'react-bootstrap';
import {RiSurveyLine} from "react-icons/ri";
import {LoginButton} from './LoginComponents';
import {Link} from 'react-router-dom';
import {FaUser} from "react-icons/fa";
import {NavLink} from "react-router-dom";
import './App.css';

function NavBar(props) {
    return (
        <Navbar className="navbar justify-content-between" fixed="top">
            <Navbar.Brand className="mx-3 text-white">
                <Link to={{ pathname: '/surveys' }} style={{color: "white", textDecoration: "none"}}>
                    <RiSurveyLine className="mb-1 text-white"/> SmartSurvey
                </Link> 
            </Navbar.Brand>

            {props.loggedIn ?
            <Nav className="mx-auto">
                <NavLink to='/create'>
                    <Button variant="light" className="mr-4 mt-1">
                        Create a survey
                    </Button>    
                </NavLink>

                <NavLink to='/surveys'> 
                    <Button variant="light" className="mt-1">
                        Show results
                    </Button>    
                </NavLink> 
            </Nav>  : <></> }
           
            <Nav.Item className="mx-3">
                {props.loggedIn ? 
                <>
                <DropdownButton className="mx-3" variant="info" title={ <><FaUser className="mb-1"/> Hello, {props.admin}</>}>
                   <Dropdown.Item className="float-right" onClick={props.doLogOut}>Logout</Dropdown.Item>
                </DropdownButton>
                </> : <LoginButton/>}
                
            </Nav.Item>
        </Navbar>
            

       
       
  
    );
}

export default NavBar;