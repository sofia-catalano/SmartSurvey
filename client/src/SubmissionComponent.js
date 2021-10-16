import './App.css';
import API from './API.js';
import {Button, Col, Row, InputGroup, Form} from 'react-bootstrap';
import {useState, useEffect} from 'react';
import {Redirect} from 'react-router';
import {Link} from 'react-router-dom';

function Submission(props){
    const [questions, setQuestions] = useState([]);
    const [name, setName] = useState("");
    const [openAnswers, setOpenAnswers] = useState([]);
    const [closeAnswers, setCloseAnswers] = useState([]);
    const [validated, setValidated] = useState(false);
    const [userId, setUserId] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const getQuestionsBySurveyId = async () => {
            try {
                //get all the questions about the survey
                const questions = await API.getQuestionsBySurveyId(props.survey.id);
                questions.sort((a,b) => (a.position > b.position) ? 1 :  -1);
                setQuestions(questions);
                let tmpClose = [];
                let tmpOpen = [];
                for(let question of questions){
                    if(question.max >= 1){
                        for(let option of question.content) {
                            let opt = {option: option.id, value: 0}
                            tmpClose.push(opt);
                        }
                    }else{
                        const answer = {questionId: question.questionId, text: ""};
                        tmpOpen.push(answer);
                       
                    }
                }
                setCloseAnswers(tmpClose);
                setOpenAnswers(tmpOpen);
            }catch(err) {
                props.handleErrors(err);
            }
        };

        const getUserId = async () => {
            try{
                const id = await API.getUserId();
                setUserId(id);
            }catch(err){
                props.handleErrors(err);
            }
        };

        if(!props.loggedIn){
            getQuestionsBySurveyId();
            getUserId();
        }else{
            setQuestions(props.userSubmission.questions);
            setName(props.userSubmission.name);
        }
       
      }, [props.loggedIn]);
      
    const updateOpenAnswer = (event) => {
        const index = openAnswers.findIndex(a => a.questionId.toString() === event.target.id);
        const tmp = [...openAnswers];
        tmp[index].text = event.target.value;
        setOpenAnswers(tmp);
    }

    const updateCloseAnswer = (event) => {
        const index = closeAnswers.findIndex(a => a.option.toString() === event.target.id);
        const tmp = [...closeAnswers];
        if(event.target.checked === true){
            tmp[index].value = 1;
        }else{
            tmp[index].value = 0;
        }
        setCloseAnswers(tmp);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        let flag = 0;
        
        //verify min and max
        for(let question of questions){
            if(question.max >= 1){
                let count = 0;
                let options = question.content;
                for(let opt of options){
                    let index = closeAnswers.findIndex(a => a.option === opt.id);
                    if(closeAnswers[index].value === 1){
                        count++;
                    }
                }
                
                if(count < question.min || count > question.max){
                    flag = 1;
                }
            }
        }

        if(form.checkValidity() === false || flag === 1){
            setValidated(true); //enable bootstrap validation
        }else{
            const answers = {userId: userId, name: name, openAnswers: openAnswers, closeAnswers: closeAnswers, surveyId: props.survey.id}; 
            API.addSurveySubmission(answers)
            .then(() => {
                props.handleSuccess({ msg: 'Form submitted with success', type: 'success' });
                setSubmitted(true);
            })
            .catch(err => {
                props.handleErrors(err);
            });
        }
    }

    return(
        <> {submitted ? <Redirect to="/surveys"/> :
        <>
            <Form className="w-50 mx-auto" noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Row className="justify-content-center">
                    {!props.loggedIn && <h1 className="">{props.survey.title}</h1>}
                </Form.Row>
                <Form.Row className="justify-content-center">
                    {!props.loggedIn && <h4 className="font-weight-light">{props.survey.description}</h4>}
                </Form.Row>
            
                <Form.Group as={Row} controlId="Name">
                    <Form.Label column sm={12} md={3}>
                        <h3 className="mx-2 mt-2">Name</h3>
                    </Form.Label>
                    <Col sm={12} md={9}>
                    <Form.Control 
                        type="text"
                        placeholder="Enter your name"
                        className="mt-3"
                        onChange={(event) => setName(event.target.value)}
                        value={name}
                        readOnly={props.loggedIn}
                        required/>
                        <Form.Control.Feedback type="invalid">Please add your name..</Form.Control.Feedback>
                    </Col> 
                </Form.Group>

            
                {questions.map((question) => {
                    return(
                        <QuestionInfo 
                            key={question.questionId}
                            loggedIn={props.loggedIn}
                            question={question}
                            updateOpenAnswer={updateOpenAnswer}
                            updateCloseAnswer={updateCloseAnswer}
                            validated={validated}
                        />
                    );
                })}

                {!props.loggedIn && 
                <Form.Row className="justify-content-end mb-4">
                    <Button size="lg" type="submit" variant="info" className="mt-3">Submit</Button> 
                </Form.Row>
                } 
            </Form>   
            {!props.loggedIn && questions.length > 0 &&
                <Row className="pb-4 mb-4 ml-4 pl-4">
                    <Link to={{ pathname: '/surveys' }}>
                        <Button variant="outline-info">Back</Button>
                    </Link>
                </Row>
            } 
            </>
        } </>
    );
}

function QuestionInfo(props){
    const {loggedIn, question, updateCloseAnswer, updateOpenAnswer, validated} = props;
    const [numberOptionsChecked, setNumberOptionsChecked] = useState(0);
    const updateOption = (event) => {
        let tmp = numberOptionsChecked;
        if(event.target.checked) {
            setNumberOptionsChecked(tmp + 1);
        }else{
            setNumberOptionsChecked(tmp - 1);
        }
        updateCloseAnswer(event);
    }
    return (
        <>
          <Form.Row>
              <Col sm={12}>
                <h3 className="mt-4 mx-2">{question.title}</h3>
              </Col>
          </Form.Row>
  
          <Form.Row >
                <Col sm={12}>
                    {question.max === 0 || question.text || question.text === "" ?
                    //openQuestion
                    <>
                    {!loggedIn && question.min === 1 && <p>Required</p>}
                    <Form.Group>
                        <Form.Control 
                            id={question.questionId}
                            as="textarea"
                            placeholder={loggedIn ? question.text : "Write something here..."}
                            readOnly={loggedIn}
                            required={question.min ? true: false} 
                            maxLength="200"
                            onChange={(event) => updateOpenAnswer(event)}/>
                        <Form.Control.Feedback type="invalid">Please insert your response..</Form.Control.Feedback>
                    </Form.Group> 
                    </>:

                    //closeQuestion 
                        <>
                            {!loggedIn ?  
                                (question.min === question.max) ? 
                                <p className="ml-2">Insert {question.min} response options</p> : 
                                <p className="ml-2">Insert between {question.min} and {question.max} response options</p>
                            :   <></> }
                            {question.content.map((c) => {
                                return(
                                    <InputGroup className="mt-2" key={c.id} min={question.min} max={question.max}>
                                        <Form.Check 
                                        className = "ml-3"
                                        type="checkbox"
                                        id={c.id} 
                                        label={c.text}
                                        checked = {c.value}
                                        disabled={loggedIn}
                                        onClick={(event) => updateOption(event)}
                                    />
                                    </InputGroup>
                                );
                            })}
                            {!loggedIn && validated && (numberOptionsChecked < question.min || numberOptionsChecked > question.max)  ?
                                <p className="text-danger small">Please choose the correct number of options..</p> : <></>
                            }
                        </>
                    }
                </Col>
            </Form.Row>
        </>
    );
   
}


export default Submission;
