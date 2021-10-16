'use strict';

const express = require('express');
const morgan = require('morgan');
const { check, validationResult } = require('express-validator');
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const userDao = require('./user-dao'); // module for accessing the users in the DB
const surveyDao = require('./survey-dao');

// init express
const app = new express();
const port = 3001;

/* Set-up the middlewares */
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static("./client/build"));

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated())
    return next();

  return res.status(401).json({ error: 'not authenticated'});
}

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function(username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { error: 'Wrong username and/or password.' });
        
      return done(null, user);
    })
  }
));

  // serialize and de-serialize the user (user object <-> session)
  // we serialize the user id and we store it in the session: the session is very small in this way
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // starting from the data in the session, we extract the current (logged-in) user
  passport.deserializeUser((id, done) => {
    userDao.getUserById(id)
      .then(user => {
        done(null, user); // this will be available in req.user
      }).catch(err => {
        done(err, null);
      });
  });

    // set up the session
    app.use(session({
      // by default, Passport uses a MemoryStore to keep track of the sessions
      secret: 'a secret sentence for the exam, not to share with anybody and anywhere, used to sign the session ID cookie',
      resave: false,
      saveUninitialized: false 
    }));

      // then, init passport
  app.use(passport.initialize());
  app.use(passport.session());

  const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    // Format express-validate errors as strings
    return `${location}[${param}]: ${msg}`;
  };

  /*** Users APIs ***/

// Login --> POST /sessions 
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json(info);
      }
      // success, perform the login
      req.login(user, (err) => {
        if (err)
          return next(err);
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser()
        return res.json(req.user);
      });
  })(req, res, next);
});

// Logout --> DELETE /sessions/current 
app.delete('/api/sessions/current', (req, res) => {
  req.logout();
  res.end();
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Unauthenticated user!'});
});


/* Get all the surveys of an admin by adminId*/
app.get('/api/admins/id/surveys', isLoggedIn,
  (req, res) => { 
  surveyDao.listAdminSurveys(req.user.id)
    .then((surveys) => res.status(200).json(surveys))
    .catch(()=> res.status(503).json({ error: `Database error during the loading of the surveys:` }) );
  }
);

// Store submission of a user on DB
app.post('/api/surveys/id/submissions',
[
  check('surveyId').isInt(),
  check('name').isLength({ min: 1, max: 200 }),
  check('openAnswers').custom((value, {req} )=> {
    for(const answer of value){
      if (!Number.isInteger(answer.questionId) || answer.text.length > 200){
        return false;
      }
    }
    return true;
  }),
  check('closeAnswers').custom((value, {req} )=> {
    for(const answer of value){
      if (!Number.isInteger(answer.option) || answer.value < 0 || answer.value > 1){
        return false;
      }
    }
    return true;
  })
], 
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  });
    }
    const answers = {
      userId: req.body.userId,
      name: req.body.name,
      openAnswers: req.body.openAnswers, 
      closeAnswers : req.body.closeAnswers,
      surveyId: req.body.surveyId
    };
    surveyDao.addSubmission(answers)
        .then((lastId) => res.status(200).json(lastId))
        .catch(() => res.status(500).json({ error: `Database error during the storing of a new submission` }));
  }
);

/* Get last user id*/
app.get('/api/surveys/users', 
  (req, res) => { 
    surveyDao.getUserId()
      .then((id) => res.status(200).json(id))
      .catch(() => res.status(500).json({ error: `Database error during the loading of the data user` }));
  }
);

/* Get all the submissions of the survey identified his id*/
app.get('/api/surveys/:id/submissions', 
  [check('id').isInt()], 
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().join(", ")  });
    }
    surveyDao.listUsersSubmissions(req.params.id)
      .then((rows) => {
        let result = [];
        let promise1 = []
        let promise2 = [];
        for (let i = 0; i < rows.length; ++i) { 
        result.push(rows[i]);
        promise1[i] = surveyDao.getCloseAnswers(rows[i].idUser, req.params.id)
              .then((closeAnswers) => {
                  result[i].closeAnswers = [...closeAnswers];
                });
        promise2[i] = surveyDao.getOpenAnswers(rows[i].idUser, req.params.id)
              .then((openAnswers) => {result[i].openAnswers = [...openAnswers];
              });
      }
      let promises = promise1.concat(promise2);
        Promise.all(promises).then(() => {
          res.status(200).json(result);
        })
      })
      .catch(() => res.status(500).json({ error: `Database error during the loading of submissions`}));
});


/* Get all the questions of a survey identified by id*/
app.get('/api/surveys/:id',
  [check('id').isInt()],
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()){
      return res.status(400).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }
    surveyDao.getQuestionsBySurveyId(req.params.id)
      .then(questions => {
        let result = [];
        let promises = [];
        for (let i = 0; i < questions.length; ++i) {
          promises.push(surveyDao.getChoicesByQuestionId(questions[i]).then((survey) => result.push(survey)))
        }
    Promise.all(promises)
    .then(() => {
        res.status(200).json(result);
    })
  })
  .catch(() => res.status(500).json({ error: `Database error during the loading of surveys`}));
});


/* Get the full list of  surveys*/
app.get('/api/surveys', 
  (req, res) => {
      surveyDao.listSurveys()
        .then((surveys) => res.status(200).json(surveys))
        .catch(() => res.status(500).json({ error: `Database error during the loading of new surveys`})); 
  });

/* Create a new survey on DB, return ID created by DB*/
app.post('/api/surveys', isLoggedIn,
  [
    check('title').isLength({ min: 1}),       
    check('questions').custom((value, {req} )=> {
      for(const question of value){
        if (question.max > 10 || question.min < 0 || question.max < 0 || !Number.isInteger(question.questionId) || question.title.length === 0){
          return false;
        }
      }
      return true;
    })
  ], 
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  });
    }
    const survey = {
        title: req.body.title,
        description: req.body.description,
        questions: req.body.questions,
        user: req.user.id,
        position: req.body.position
    };
    surveyDao.createSurvey(survey)
        .then((lastId) => res.status(201).json(lastId))
        .catch(() => res.status(500).json({ error: `Database error during the creation of new surveys`})); 
    }
);

/*** End APIs ***/

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

