/*
 * All the API calls
 */

const BASEURL = '/api';

function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // always return {} from server, never null or non json, otherwise it will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyze the cause of error
          response.json()
            .then(obj => reject(obj)) // error msg in the response body
            .catch(err => reject({ error: response.statusText}))
        }
      })
      .catch(err => reject({ error: "Cannot communicate with server"  })) // connection error
  });
}

/*
 * Survey APIs
 */

async function addSurvey(survey) {
  return getJson(
    fetch(BASEURL + '/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
    })
  )
}

async function getSurveys() {
  return getJson(
    fetch(BASEURL + '/surveys')
  )
}

async function getQuestionsBySurveyId(surveyId) {
  return getJson(
    fetch(BASEURL + '/surveys/' + surveyId)
  )
}

async function getAdminSurveys() {
  return getJson(
    fetch(BASEURL + '/admins/id/surveys')
  )
}


async function addSurveySubmission(answers) {
  return getJson(
    fetch(BASEURL + '/surveys/id/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
  )
}


async function getUserId() {
  return getJson(
    fetch(BASEURL + '/surveys/users')
  )
}

async function getSurveySubmissions(surveyId) {
  return getJson(
    fetch(BASEURL + '/surveys/' + surveyId + '/submissions')
  )
}


/*
 * User APIs
 */
async function logIn(credentials) {
  return getJson(fetch(BASEURL + '/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })
  )
}

async function logOut() {
  await fetch(BASEURL + '/sessions/current', { method: 'DELETE' });
}

async function getUserInfo() {
  return getJson(
    fetch(BASEURL + '/sessions/current')
  )
}

const API = {logIn, logOut, getUserInfo, addSurvey, getQuestionsBySurveyId, getSurveys, getAdminSurveys, addSurveySubmission, getUserId, getSurveySubmissions};
export default API;