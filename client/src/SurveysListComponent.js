import {ListGroup, Button, Row, Col, Alert} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {FaUserEdit} from "react-icons/fa";
function SurveysList(props) {
    return(
        <div className="w-75 mx-auto">
            <Row className="justify-content-center">
                <h1 className="font-italic font-weight-bold">{props.loggedIn ? "Your surveys" : "Surveys"}</h1>
            </Row>
           
            
            <ListGroup as="ul" variant="flush" className="mt-3">
            {
            props.surveys.length > 0 && props.surveys.map((survey) => {
                return (
                    <ListGroup.Item as="li" key={survey.id}>
                        <Row>
                            <SurveyInfo survey={survey} loggedIn={props.loggedIn}/>
                        </Row>   
                    </ListGroup.Item>
                );
            })}
            {props.surveys.length <= 0 && 
                <Alert variant="danger" className="mx-auto w-75 text-center">
                    <Alert.Heading>There are not surveys yet!</Alert.Heading>
                </Alert>
            }
            </ListGroup>
   
        </div>
    );
}

function SurveyInfo(props){
    return (
        <>
            <Col sm="12" md="8">
                <h1 className="font-italic">{props.survey.title}</h1>
                {props.survey.description}
            </Col>
            {
            props.loggedIn && 
            <Col sm="2" md="1" className="mt-3">
                <FaUserEdit size={30}/>
                <Row>
                {props.survey.numSubmissions} users
                </Row>
            </Col>}

            <Col sm="10" md="3" className="mt-3 d-flex flex-row-reverse">
                {props.loggedIn ? 
                <Link to={{pathname: "/results", state: {survey: props.survey}}}>
                    <Button size="lg" variant="info" disabled={props.survey.numSubmissions === 0}>
                        Show answers
                    </Button>
                </Link>
                :
                <Link to={{pathname: `/survey/${props.survey.id}/submission`, state: {survey: props.survey} }}>
                    <Button size="lg" variant="info">
                        Fill in
                    </Button>
                </Link>}
            </Col>
          
        </>
    );
   
}

export default SurveysList;