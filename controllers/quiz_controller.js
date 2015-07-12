/**
 * Created by Jonatan on 04/07/2015.
 * PErmite lelvar el control de todas las rutas
 */

var expresss = require("express");
var models = require("../models/models.js");
var tema = ["Otro", "Humanidades", "Ocio", "Ciencia", "Tecnologia" ];

//MW de Autoload - factoriza el codigo si en el path aparece :quizId
exports.load = function (req, res, next, quizId) {
    models.Quiz.findById(quizId).then(function (quiz) {
        if (quiz) {//si se encontro el registro con quizId deseado
            req.quiz = quiz; //se precarga en la cabezera req el objeto de la BD buscado
            next(); //se pasa al mw que maneja la ruta en la que estamos
        } else {
            next(new Error('No existe quizId=' + quizId));
        }
    }).catch(function (error) {
        next(error)
    });
};


//GET /quizes EN ESTE NO SE APLICA EL AUTOLOAD SOLO EN SHOW Y ANSWER
//ed quizes:quizes ya que asi lo dicta el convenio si se desea obtener una gran numero de recursos debe de ir en
//plural en cambio si es solo 1 seria quiz:quiz como se ve en otros casos como es el de autoload
exports.index = function (req, res) {
    /*models.Quiz.findAll().then(function (quizes) {
        res.render('quizes/index.ejs', {quizes: quizes, errors: []});
    }).catch(function(error){next(error)});*/

    var search="%"+req.query.valor+"%";
    if(req.query.boton){
        models.Quiz.findAll({where:["tema like ?",search],order:'pregunta ASC'}).then(function(quizes){
            res.render('quizes/index.ejs', {quizes:quizes,errors: []});
        }).catch(function(error){next(error);})
    }
    else{
        models.Quiz.findAll().then(function(quizes){
            res.render('quizes/index.ejs', {quizes:quizes,errors: []});
        }).catch(function(error){next(error);})
    }


};

//GET /quizes/:id
exports.show = function (req, res) {
    res.render('quizes/show', { quiz: req.quiz, errors: []});
};

//GET /quizes/:id/answer
exports.answer = function (req, res) {
    var resultado = "Incorrecto";
    if (req.query.respuesta === req.quiz.respuesta) {
        resultado = "Correcto";
    }
    res.render('quizes/answer', {
            quiz: req.quiz,
            respuesta: resultado,
            errors: []
        }
    );
};

// GET /quizes/new
exports.new = function (req, res) {
    var quiz = models.Quiz.build( // crea objeto quiz con dos propiedades pregunta y respuesta
        {pregunta: "Pregunta", respuesta: "Respuesta",tema:"Tema"}
    );

    res.render('quizes/new', {quiz: quiz, tema:tema,errors: []});
};


// POST /quizes/create
exports.create = function (req, res) {
    var quiz = models.Quiz.build(req.body.quiz);

    //en el body ya va el parametro tema


    quiz
        .validate()
        .then(
        function (err) {
            if (err) {
                res.render('quizes/new', {quiz: quiz, errors: err.errors});
            } else {
                quiz // save: guarda en DB campos pregunta y respuesta de quiz
                    .save({fields: ["pregunta", "respuesta","tema"]})
                    .then(function () {res.redirect('/quizes')})
            }      // res.redirect: Redirección HTTP a lista de preguntas
        }
    ).catch(function(error){next(error)});
};

//GET /quizes/:id/edit para editar la pregunta
exports.edit = function(req,res){
    var quiz = req.quiz; //autoload de instancia de quiz, ya qu ela url llevaba quizId se activo el autoload
    res.render('quizes/edit',{quiz:quiz,tema:tema,errors:[]});
};

//PUT /quizes/update
//Recordar que lo que se envia a traves de los formularios se almacena en el body
exports.update = function(req,res){
    req.quiz.pregunta = req.body.quiz.pregunta;
    req.quiz.respuesta= req.body.quiz.respuesta;
    req.quiz.tema = req.body.tema;

    req.quiz
        .validate()
        .then(function(err){
            if(err) {
                res.render('quizes/edit', {quiz: req.quiz, tema:tema,errors: err.errors});
            } else{
                req.quiz
                    .save({fields:["pregunta","respuesta","tema"]})
                    .then(function(){res.redirect('/quizes');});
            }//Redireccion HTTP a lista de preguntas
        }
    );//fin primer then
};//fin de mw //PUT

//DELETE /quizes/:quizId en este caso se activa el autoload por eso se almacena
//el recurso en req.quiz
exports.destroy = function(req, res) {
    req.quiz.destroy().then( function() {
        res.redirect('/quizes');
    }).catch(function(error){next(error)});
};
