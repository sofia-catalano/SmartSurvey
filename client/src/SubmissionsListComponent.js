import API from './API.js';
import {Button, Col, Row, Spinner} from 'react-bootstrap';
import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import Submission from './SubmissionComponent.js';
import {FaArrowCircleLeft, FaArrowCircleRight} from "react-icons/fa";

function SubmissionsList(props){
    const [usersSubmission, setUsersSubmission] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countUser, setCountUser] = useState(0);

    useEffect(() => {
        if(props.loggedIn){
            API.getSurveySubmissions(props.survey.id)
            .then((submissions)=> {
                let usersSubmissions = [];
                for(let submission of submissions){
                        const result = submission.closeAnswers.reduce((acc, d) => {
                            const found = acc.find(a => a.questionId === d.questionId);
                            const value = { id: d.choiceId, text: d.text, value:d.value }; // the element in data property
                            if (!found) {
                                acc.push({questionId:d.questionId, title: d.title, position: d.position, content: [value]}) // not found, so need to add data property
                            }
                            else {
                                found.content.push(value) // if found, that means data property exists, so just push new element to found.data.
                            }
                            return acc;
                        }, []);
                    
                        usersSubmissions = [...usersSubmissions, {name: submission.name, questions: [...result.concat(submission.openAnswers)]} ];
                }

                for(let submission of usersSubmissions){
                    submission.questions.sort((a,b) => (a.position > b.position) ? 1 :  -1);
                }  
                
                setUsersSubmission(usersSubmissions);  
                setLoading(false);    
            })
            .catch(err => {
                props.handleErrors(err);
            });
        }   
    }, [props.loggedIn]);

    const goRight = () => {
        if(countUser < usersSubmission.length){
            setCountUser((count) => count + 1);
        } 
    }

    const goLeft = () => {
        if(countUser > 0){
            setCountUser((count) => count - 1);
        } 
    }

    return(
        <>{loading ?
            <Row className="justify-content-center">
            <Spinner animation="border" variant="info"/> 
          </Row>
          :
          <>
            <Row>
                <Col sm={{ span: 5, offset: 1 }}>
                    <Button variant="info" onClick={goLeft} disabled={countUser <= 0}>
                        <FaArrowCircleLeft size={50}/>
                    </Button> 
                </Col>
                <Col sm={{ span: 1, offset: 4 }}>
                    <Button variant="info" onClick={goRight} disabled={countUser >= usersSubmission.length-1}>
                        <FaArrowCircleRight size={50}/>
                    </Button>
                </Col>
            </Row>

            <Row>
                <Col sm={12}>
                    <Submission
                        key={countUser}
                        userSubmission={usersSubmission[countUser]}
                        survey={props.survey}
                        loggedIn={props.loggedIn}/>
                </Col>
            </Row>

            <Row className="pb-4 mb-4 ml-4 pl-4">
                <Link to={{ pathname: '/surveys' }}>
                    <Button variant="outline-info">Back</Button>
                </Link>
            </Row>
        </>
        }
        </>

    );

}



export default SubmissionsList;
