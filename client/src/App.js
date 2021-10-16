import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import API from './API.js';
import NavBar from './NavbarComponent.js';
import SurveysList from './SurveysListComponent';
import NotFound from './NotFound.js';
import Submission from './SubmissionComponent';
import {LoginForm} from './LoginComponents';
import {Container, Row, Alert, Spinner} from 'react-bootstrap';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {useState, useEffect} from 'react';
import {Redirect} from 'react-router';
import SubmissionsList from './SubmissionsListComponent';
import CreationForm from './CreationComponent';


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(true); 
  const [admin, setAdmin] = useState('');
  const [message, setMessage] = useState('');
  const [surveys, setSurveys] = useState([]);

  useEffect(()=> {
    const checkAuth = async() => {
      try {
        const userInfo = await API.getUserInfo();
        setAdmin(userInfo.name);
        setLoggedIn(true);
      } catch(err) {
        console.log(err.error);
      }
    };
    checkAuth();
  }, []);


  useEffect(()=> {
    if(loggedIn){
      API.getAdminSurveys()
        .then((surveys)=>{
          setSurveys(surveys);
          setDirty(false);
          setLoading(false);
        })
        .catch(err => handleErrors(err));
    }else {
      API.getSurveys()
        .then((surveys)=>{
          setSurveys(surveys);
          setDirty(false);
          setLoading(false);
        })
        .catch(err => handleErrors(err));
    }
  }, [dirty, loggedIn]);

  const doLogIn = async (credentials) => {
    try {
      const userInfo = await API.logIn(credentials);
      setAdmin(userInfo.name);
      setLoggedIn(true);
      setLoading(true);
    } catch(err) {
      throw err;
    }
  }

  const doLogOut = async () => {
    try {
       await API.logOut();
        setAdmin('');
        setSurveys([]);
        setLoading(false);
        setLoggedIn(false);
        setMessage('');
    } catch(err) {
      handleErrors(err);
    }
  }

  const handleErrors = (err) => {
    setMessage({ msg: err.error, type: 'danger' });
    setTimeout(() => {
      // After 3 seconds set the message empty 
      setMessage('');
    }, 3000)
  }

  const handleSuccess = (message) => {
    setMessage(message);
    setTimeout(() => {
      // After 3 seconds set the message empty 
      setMessage('');
    }, 3000)
  }

  return (
     <Router>
        <NavBar doLogOut={doLogOut} loggedIn={loggedIn} admin={admin}/>
        <Container className="below-nav" id="main-container" fluid>
          {message &&
            <Row>
              <Alert variant={message.type} className="mx-auto w-75" onClose={() => setMessage('')} dismissible>
                <Alert.Heading>{message.type === 'danger' ? `Oh snap! You got an error!`: ""}</Alert.Heading>
                  <p>{message.msg} </p>
              </Alert> 
            </Row>}
            <Switch>
              <Route exact path="/login" render={() => 
                <>{loggedIn ?
                    <Redirect to="/surveys"/>
                  : <LoginForm doLogIn={doLogIn} handleErrors={handleErrors}/> } </> 
              }/>

              <Route exact path='/' render={() =>
                <Redirect to='/surveys'/>
              }/>

              <Route exact path='/create' render={() =>
                <>{loggedIn ?
                    <CreationForm loggedIn={loggedIn} setDirty={setDirty} handleSuccess={handleSuccess} handleErrors={handleErrors}/>
                  : <Redirect to="/surveys" />}</>
              }/>

              <Route exact path='/survey/:id/submission' render={({location}) => 
                <>{loggedIn ?
                  <Redirect to="/surveys"/>   : //un utente loggato non può compilare questionario
                  <Submission survey={location.state ? location.state.survey : ""} handleErrors={handleErrors} handleSuccess={handleSuccess} loggedIn={loggedIn}/>}
                </>
              }/>

              <Route exact path='/results' render={({location}) =>
                <>{loggedIn ?
                  <>
                    {loading ? 
                      <Row className="justify-content-center">
                        <Spinner animation="border" variant="info"/> 
                      </Row>
                      : 
                    <SubmissionsList survey={location.state ? location.state.survey : ""} handleErrors={handleErrors} loggedIn={loggedIn}/> }
                  </> 
                :
                  <Redirect to="/surveys"/> }  
                </>
              }/>

              <Route exact path='/surveys' render={() => //if the user is logged shows his surveys, else shows all surveys
                <>{loading ? 
                    <Row className="justify-content-center">
                      <Spinner animation="border" variant="info"/> 
                    </Row>
                    : 
                    <SurveysList setSurveys={setSurveys} surveys={surveys} setMessage={setMessage} loggedIn={loggedIn} dirty={dirty} setDirty={setDirty} setLoading={setLoading}/> 
                  }
                </>
              }/>
              
              <Route path='/' render={() =>
                <NotFound/>
              }/>
            </Switch>
        </Container>
     </Router>
  );
}



export default App;
