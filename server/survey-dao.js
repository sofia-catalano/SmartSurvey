"use strict";
const db = require('./db');

// Add a new survey
exports.createSurvey = (survey) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO surveys(title, description, admin, numSubmissions) VALUES(?, ?, ?, ?)';
        db.run(sql, [survey.title, survey.description, survey.user, 0], function (err) {
            if (err) {
                reject(err);
                return;
            }

            const surveyID = (this.lastID);
            for(let i = 0; i < survey.questions.length; i++){
                const sql2 = 'INSERT INTO questions(title, min, max, survey, position) VALUES (?, ?, ?, ?, ?)';
                db.run(sql2, [survey.questions[i].title, survey.questions[i].min, survey.questions[i].max, surveyID, survey.questions[i].position], function(err){
                    if (err) {
                        reject(err);
                        return;
                    }
                    const questionID = (this.lastID);
                    if(survey.questions[i].max >= 1){
                        for(let j = 0; j < survey.questions[i].content.length; j++ ){
                            const sql3 = 'INSERT INTO choices(question, text) VALUES (?, ?)';
                            db.run(sql3, [questionID, survey.questions[i].content[j]], function(err){
                                if(err){
                                    reject(err);
                                    return;
                                }
                                resolve(this.lastID);  //VEDERE COSA TORNARE QUII, SE SURVEY.ID
                            }); 
                        }
                    }
                });
            }
        resolve(this.lastID); 
        });
    });
};


// get all surveys
exports.listSurveys = () => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, title, description, admin FROM surveys';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  };
  
    // get the survey identified by {id}
    //DA VEDERE SE TOGLIERE IL JOIN CON SURVEYS
    exports.getQuestionsBySurveyId = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 
        `SELECT questions.id as questionId, questions.title, questions.min, questions.max, questions.survey, questions.position
        FROM questions
        WHERE questions.survey = ?`;
            db.all(sql, [id], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }
    
    //get all the options of question
    exports.getChoicesByQuestionId = (row) => {
        return new Promise((resolve, reject) => {
            const sql2 = 'SELECT * FROM choices WHERE question=?';
            db.all(sql2, [row.questionId], (err, choices) => {
                if (err) {
                    reject(err);
                    return;
                }
                let result = row;
                result.content = choices;
                resolve(result);
            });
        });
    }

    // get all surveys of an admin
    exports.listAdminSurveys = (id) => {
        return new Promise((resolve, reject) => {
        const sql = `SELECT id, title, description, numSubmissions
                        FROM surveys
                        WHERE admin = ?`;
        db.all(sql, [id], (err, rows) => {
            if (err) {
            reject(err);
            return;
            }
            resolve(rows);
        });
    });
  };


    //Add a submission
    exports.addSubmission = (answers) => {
        return new Promise((resolve, reject) => {
            for(let answer of answers.openAnswers){
                const sql = 'INSERT INTO openAnswers(idUser, question, text, name) VALUES (?, ?, ?, ?)'
                db.run(sql, [answers.userId, answer.questionId, answer.text, answers.name], function(err){
                    if(err){
                        reject(err);
                        return;
                    }
                });
            }
            for(let answer of answers.closeAnswers){
                const sql = 'INSERT INTO closeAnswers(idUser, choice, value, name) VALUES (?, ?, ?, ?)'
                db.run(sql, [answers.userId, answer.option, answer.value, answers.name], function(err){
                    if(err){
                        reject(err);
                        return;
                    }
                });
            }

            const sql = `UPDATE surveys
                        SET numSubmissions = numSubmissions + 1
                        WHERE id = ?`
            db.run(sql, [answers.surveyId], function(err){
                if(err){
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }

  // Get the next user ID 
  exports.getUserId = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT MAX(idUser) as idUser
                     FROM closeAnswers 
                     UNION 
                     SELECT MAX(idUser) as idUser
                     FROM openAnswers
                     ORDER BY idUser DESC
                     LIMIT 1`;
        db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (row.idUser === null) {
                resolve(1); //1 o 0 ???? 
            } else {
                resolve(row.idUser+1);
            }
        });
        });
    }

    /* Get all the users that have submitted the survey identified by ID*/
    exports.listUsersSubmissions = (surveyId) => {
        return new Promise((resolve, reject) => {
            const sql = 
            `SELECT idUser, name
            FROM closeAnswers JOIN surveys JOIN questions JOIN choices
            WHERE surveys.id = ? AND questions.survey = surveys.id AND choices.question = questions.id AND choices.id = closeAnswers.choice
            UNION
            SELECT idUser, name
            FROM openAnswers JOIN surveys JOIN questions
            WHERE surveys.id = ? AND questions.survey = surveys.id AND openAnswers.question = questions.id`
            db.all(sql, [surveyId, surveyId], (err, rows) => {
                if (err) {
                reject(err);
                return;
                }
                resolve(rows);
            });
        });
    }

    // get all the open answers given a survey and a user
    exports.getOpenAnswers = (idUser, idSurvey) => {
        return new Promise((resolve, reject) => {
            const sql = 
            `SELECT questions.id as questionId, questions.title, questions.position, openAnswers.text
            FROM openAnswers JOIN questions
            WHERE questions.survey = ? AND questions.id = openAnswers.question AND openAnswers.idUser = ?
            ORDER BY questions.position`
            db.all(sql, [idSurvey, idUser], (err, rows) => {
                if (err) {
                reject(err);
                return;
                }
                resolve(rows);
            });
        });
    }


    // get all the close answers given a survey and a user
    exports.getCloseAnswers = (idUser, idSurvey) => {
        return new Promise((resolve, reject) => {
            const sql = 
            `SELECT questions.id as questionId, questions.title, questions.position, closeAnswers.value, choices.id as choiceId, choices.text
            FROM closeAnswers JOIN questions JOIN choices
            WHERE questions.survey = ? AND choices.question = questions.id AND closeAnswers.idUser = ? AND closeAnswers.choice = choices.id
            ORDER BY questions.position`
            db.all(sql, [idSurvey, idUser], (err, rows) => {
                if (err) {
                reject(err);
                return;
                }
                resolve(rows);
            });
        });
    }
