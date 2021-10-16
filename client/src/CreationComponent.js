import {Form, Button, Row, Col, InputGroup, FormControl} from 'react-bootstrap';
import {FaTrash} from "react-icons/fa";
import {useState} from 'react';
import {HiArrowCircleDown, HiArrowCircleUp} from "react-icons/hi";
import {Redirect} from 'react-router';
import API from './API.js';


function CreationForm(props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState([]);
    const [addingQuestion, setAddingQuestion] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [validated, setValidated] = useState(false);

    const submitSurvey = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        if(form.checkValidity() === false){
            setValidated(true); //enable bootstrap validation
        }
        else{
            const survey = {title: title, description: description, questions: questions};
            let position = 0;
            for(let question of survey.questions){
              position += 1;
              question.position = position;
            }
            API.addSurvey(survey)
            .then(()=>{
                props.handleSuccess({ msg: 'Form created with success', type: 'success' });
                setSubmitted(true);
                props.setDirty(true);
            }).catch((err) => {
                props.handleErrors(err);
              });
        }
    }
    
    const addQuestion = (questionTitle, content, min, max) => {
        let id = questions ? questions.reduce((max, question) => question.questionId > max ? question.questionId : max, 0) + 1 : 0;
        const newQuestion = {questionId: id, title: questionTitle, content: content, min: min, max: max};
        setQuestions((questions)=> [...questions, newQuestion]);
        setAddingQuestion(false);
    }

    const deleteQuestion = (questionId) => {
        setQuestions((questions) => questions.filter(question => question.questionId !== questionId));    
    }

    const goUp = (questionId) => {
        let data = [...questions];
        let index;
        let tmp;
        data.forEach((d) =>{
            if(d.questionId === questionId){
                index = data.indexOf(d);   
                tmp = d;
            }
        })
        data[index] = data[index-1];
        data[index-1] = tmp;
        setQuestions(data);
    }

    const goDown = (questionId) => {
        let data = [...questions];
        let index;
        let tmp;
        data.forEach((d) =>{
            if(d.questionId === questionId){
                index = data.indexOf(d);   
                tmp = d;
            }
        })
        data[index] = data[index+1];
        data[index+1] = tmp;
        setQuestions(data);
    }

    return (
        <> {submitted ? <Redirect to="/surveys"/> : 
        <>
            <Form className="w-50 mx-auto" noValidate validated={validated} onSubmit={submitSurvey}>
          
                 <Row className="justify-content-end">
                    <Button size="lg" type="dubmit" variant="success" disabled={questions.length <= 0}>
                        Publish Survey
                    </Button>    
                 </Row>       
    
                <Row>
                    <Form.Group as={Col} controlId="formSurvey">
                        <Form.Label><h2>Title</h2></Form.Label>
                        <Form.Control 
                            size="lg"
                            placeholder="Write something here..."
                            value={title}
                            readOnly={!props.loggedIn}
                            onChange={(event)=>setTitle(event.target.value)}
                            required/>
                        <Form.Control.Feedback 
                            type="invalid">
                                Please choose a title..
                        </Form.Control.Feedback>
                    </Form.Group>
                </Row>
                <Row>
                    <Form.Group as={Col} controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control 
                            as="textarea"
                            placeholder="Write something here..."
                            value={description}
                            readOnly={!props.loggedIn}
                            onChange={(event)=>setDescription(event.target.value)}/>
                    </Form.Group>
                </Row>
            </Form>

            {questions ? questions.map((question, index) => ( 
            <Question
                key={question.questionId}
                index={index}
                question={question}
                loggedIn={props.loggedIn}
                nQuestions={questions.length}
                addQuestion={addQuestion}
                deleteQuestion={deleteQuestion}
                goUp={goUp}
                goDown={goDown}>
        
            </Question>))
            : <></>}

            {addingQuestion === true ? 
            <Question 
                loggedIn={props.loggedIn}
                index={questions.length}
                addQuestion={addQuestion}>
            </Question>  : 
            <Row className="w-75 justify-content-end">
                <Button variant="info" onClick={() => setAddingQuestion(true)} className="mt-3">Add a new question</Button>
            </Row>}
         
        </> 
      } </>
    );
}


function Question(props){
    const {loggedIn, question, index, addQuestion, deleteQuestion, goUp, goDown, nQuestions} = props;
    const [questionTitle, setQuestionTitle] = useState(question ? question.title : "");
    const [content, setContent] = useState(question ? question.content : []);
    const [min, setMin] = useState(question ? question.min : 0);
    const [max, setMax] = useState(question ? question.max : 1); //0 open question, 1 close question single, >1 close question multiple
    const [validated, setValidated] = useState(false);

    const handleSubmit = (event) =>{
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        if(form.checkValidity() === false){
            setValidated(true); //enable bootstrap validation
        }
        else{
            addQuestion(questionTitle, content, min, max);
            setQuestionTitle("");
            setContent([]);
            setMin(0);
            setMax(1);
        }
    }
    return (
      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
        className="w-50 mx-auto"
      >
        <Row>
          <Col sm={6}>
            <h4 className="mt-3">Question {index + 1}</h4>
          </Col>

          {loggedIn && question ? (
            <>
              <Col sm={4}>
                <Button
                  className="mt-3"
                  variant="danger"
                  onClick={() => deleteQuestion(question.questionId)}
                >
                  Delete Question
                </Button>
              </Col>

              <Col sm={1}>
                <Button
                  variant="link"
                  className="shadow-none"
                  disabled={index === nQuestions - 1 ? 1 : 0}
                  onClick={() => goDown(question.questionId)}
                >
                  <HiArrowCircleDown size="25" />
                </Button>
              </Col>
              <Col sm={1}>
                <Button
                  variant="link"
                  className="shadow-none"
                  disabled={index === 0 ? 1 : 0}
                  onClick={() => goUp(question.questionId)}
                >
                  <HiArrowCircleUp size="25" />
                </Button>
              </Col>
            </>
          ) : (
            <></>
          )}

        {loggedIn && !question ? (
            <Col sm={12} md={4} className="mt-2">
              <Form.Check
                inline
                label="Close question"
                name="typeQuestion"
                type="radio"
                id="close"
                defaultChecked={max >= 1}
                required
                onClick={() => setMax(1)}
              />
              <Form.Check
                inline
                label="Open question"
                name="typeQuestion"
                type="radio"
                id="open"
                required
                onClick={() => setMax(0)}
              />
            </Col>
          ) : (
            <></>
          )}
        </Row>

        <Row>
          <Form.Group controlId="formQuestion" as={Col} sm={12} md={8}>
            <Form.Label>Question Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Write something here.."
              value={questionTitle}
              onChange={(event) => setQuestionTitle(event.target.value)}
              readOnly={!loggedIn || question}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please choose a question title..
            </Form.Control.Feedback>
          </Form.Group>
        </Row>

        {loggedIn && max >= 1 ? (
          <CloseQuestion
            question={question}
            options={content}
            setOptions={setContent}
            min={min}
            max={max}
            setMin={setMin}
            setMax={setMax}
            loggedIn={loggedIn}
            validated={validated}
          />
        ) : (
          <OpenQuestion question={question} min={min} setMin={setMin} />
        )}
        <Row className="ml-1">
          {loggedIn && !question ? (
            <Button
              type="submit"
              variant="info"
              className="mt-3"
            >
              Add question
            </Button>
          ) :
            <></>
          }
        </Row>
      </Form>
    );
}

function CloseQuestion(props){
    const {options, setOptions, min, max, setMin, setMax, loggedIn, question, validated} = props;
    const addOption = () => { 
        setOptions(oldOptions => [...oldOptions, ""]);
    }

    const updateOption = (event, index) => {
        const tmp=[...options];
        tmp[index] = event.target.value;
        setOptions(tmp);
    }

    return(
        <> 
            {options.map((option, index) => (
                <Row key={index}>
                    <Col sm={12} md={8}>
                        <InputGroup>
                            <InputGroup.Checkbox
                            aria-label={index}
                            disabled={loggedIn}
                            />
                            <Form.Control
                            type="text" 
                            aria-label={index}
                            placeholder={`Option ${index +1}`}
                            value={option}
                            onChange={(event) => updateOption(event, index)}
                            readOnly={!loggedIn || question}
                            required/>
                            {loggedIn && !question ? 
                                <Button
                                variant="light"
                                onClick={()=>setOptions(options.filter((data, idx) => idx !== index))}
                                disabled={options.length===1}>
                                    <FaTrash/>
                                </Button>
                            : <></>}
                        </InputGroup>
                    </Col>
                </Row>
            )) }    
            
            {options.length < 10 && !question ? 
                <Row>
                    <Col sm={12} md={8}>
                        <InputGroup>
                            <InputGroup.Checkbox
                            aria-label="Add option"
                            disabled/>
                            <FormControl 
                            aria-label="Add option" 
                            onClick={addOption}
                            placeholder="Click to add an option"
                            readOnly/>
                        </InputGroup>
                    </Col>
                </Row>
            : <></>}

            {options.length < 1 && !question && validated ? 
                <div className="text-danger small">Please insert an option..</div>  
            : <></>} 
            

            {loggedIn ? 
             <Row className="mt-3">
                <Form.Group as={Col} sm={6} md={4}>
                    <Form.Label>
                      Min answers required
                    </Form.Label>
                    <Form.Control 
                    type="number" 
                    min={0} 
                    max={max}
                    onChange={(event) => setMin(event.target.value)} 
                    defaultValue={min || 0 }
                    readOnly={question} 
                    required/>
                    <Form.Control.Feedback
                    type="invalid"
                    >
                        Please insert a valid number
                    </Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} sm={6} md={4}>
                    <Form.Label>
                        Max answers required
                    </Form.Label>
                    <Form.Control
                    type="number"
                    min={min > 1 ? min : 1}
                    max={options.length}
                    onChange={(event) => setMax(event.target.value < 1 ? 1 : event.target.value)}
                    defaultValue={max || 1}
                    readOnly={question}
                    required/>
                    <Form.Control.Feedback 
                    type="invalid">
                        Please insert a valid number
                    </Form.Control.Feedback>
                </Form.Group>
             </Row> 
             
            : <></>}   
        </>
    );
}



const OpenQuestion = (props) => {
    const {question, min, setMin} = props;
    return (
        <Row>
            <Form.Group as={Col} sm="12">
                <Form.Check label="Required" name="required" type="switch" id={question ? question.questionId : -1} checked={props.min} disabled = {question ? question.questionId !== -1 ? true : false : false} onChange={()=> (min ? setMin(0) : setMin(1))} />
            </Form.Group>
        </Row>
       
    );
}

export default CreationForm;