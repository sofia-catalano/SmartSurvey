import './App.css';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import {useState} from 'react';
import {FaUserCircle} from "react-icons/fa";
import {Link} from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    let valid = true;
    if (username === '' || password === '' || password.length < 6) {
      valid = false;
      props.handleErrors({error: 'Wrong username and/or password'});
    }

    if(valid){
      props.doLogIn(credentials)
        .catch((err) => props.handleErrors(err))
    }

  };

  return (
    <Container as={Col} sm={8} md={5} className="task-form">
      <div className="text-center user-icon">
          <FaUserCircle size={60}></FaUserCircle>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center">
          <Form.Group as={Col} sm={10} controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email.."
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Form.Group>

          <Form.Group as={Col} sm={10} controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password.."
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Group>
          <Container className='d-flex justify-content-center'>
            <Button className="log-button my-4" type="submit">
              Login
            </Button>
          </Container>
      
          </Row>
      </Form>
    </Container>
  );
}

function LoginButton() {
  return(
    <Link to={{ pathname: '/login' }}>
      <Button className="float-right" variant="info">Login</Button>
    </Link>
     
  )
}

export {LoginForm, LoginButton};