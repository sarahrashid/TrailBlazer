var express = require('express');
var app = express();
var formidable = require('formidable');
var credentials = require('./credentials.js');
var bodyparser = require('body-parser');
var session = require('express-session');
var parseurl = require('parseurl');
var mongodb = require('mongodb');

// Block the header from containing information about the server
app.disable('x-powered-by');
// Set up Handlebars
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);


app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-parser')(credentials.cookieSecret));

//initialize session
app.use(session({
	// Only save back to the session store if a change was made
	resave: false,
	// Doesn't store data if a session is new and hasn't been modified
	saveUninitialized: true,
	// The secret string used to sign the session id cookie
	secret: credentials.cookieSecret
}));


// Create a directory called public and then a directory named img inside of it app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));

//The routes go here!!!

app.get('/', function(req, res){
	// Point at the home.handlebars view, 1st action is render Home page
	res.render('home');
});

app.get('/signup', function(req, res){
	res.render('signup');
});

app.get('/register', function(req,res) {
	res.render('register');
});

app.get('/postTrail', function(req,res) {
	res.render('postTrail');
});

//connect SignUp page and data to MongoDB
app.post('/register', function(req,res) {
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/trailblazer';
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Unable to connect to the Server:', err);
		}
		else {
			console.log('Connected to server');
			var collection = db.collection('registration');
			var signup = {
				firstname: req.body.firstname,
				lastname: req.body.lastname, username: req.body.username,
				email: req.body.email, pwd: req.body.pwd, gender: req.body.gender
			};
			collection.find({userame:signup.username}).toArray(function(err,result){
				if(err){
					console.log(err);
				} 
				else if(result.length){
					db.close();
					res.send('Username already taken.');
				}
				else{
					collection.insert([signup], function (err, result) {
						if (err) {
						console.log(err);
						}
						else {
						res.redirect("/myprofile")
						}
						db.close();
					});
				}
			})
		};
	});
});

app.post('/postTrail', function (req, res) {
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/trailblazer';
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Cannot post to database', err);
		}
		else {
			console.log('Posted to database');
			var collection = db.collection('trails');
			var postTrail = { 
				username: req.cookies.username,
				imageUrl: req.body.picture,
				trailLocation: req.body.trailLocation,
				trailDescription: req.body.trailDescription,
				trailReccomendation: req.body.trailReccomendation
			};
			collection.insert([postTrail], function (err, result) {
				if (err){
					console.log(err);
				}
				else {
					res.redirect("/explorehikes")
				}
				db.close();
			});
		}
	});
}); 



app.get('/beginnertips', function(req,res){
	res.render('beginnertips');
});

app.get('/featuredhike',function(req,res){
	res.render('featuredhike');
});

app.get('/about',function(req,res){
	res.render('about');
});

app.get('/explorehikes', function(req,res) {
	if(req.cookies.username) {
		var MongoClient = mongodb.MongoClient;
		var url = 'mongodb://localhost:27017/trailblazer';
		MongoClient.connect(url, function(err, db) {
			if (err) {
				console.log('Cannot post to database', err);
			}
			else {
				console.log('Retrieving all trails from database');
				var collection = db.collection('trails');
				collection.find().toArray(function(err, result) {
					if (err){
						console.log(err);
					}
					else {
						res.render('explorehikes', {trails: result});
					}
					db.close();
				});
			}
		});
	} else {
		res.render('login');
	}
});

app.get('/login',function(req,res){
	res.render('login');
});

app.get('/checklogin',function(req,res){
	res.render('checklogin');
});

app.post('/checklogin', function(req,res) {
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/trailblazer';
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Unable to connect to the Server:', err);
		}
		else {
			console.log('Connected to server');
			var collection = db.collection('registration');
			var a = req.body.username; 
			var b = req.body.password; 
			collection.find({"username": a, "password":b}).toArray(function (err, result) {
				if (err) {
					res.send(err);
				} else if (result.length) {
					res.cookie('username', a, {expire : new Date() + 9999});
					res.redirect("/myprofile");
				} else {
					res.send('Invalid login');
				}
				db.close();
			}); 
		} 
	}); 
});


app.get('/myprofile', function(req,res) {
	if(req.cookies.username) {
		var MongoClient = mongodb.MongoClient;
		var url = 'mongodb://localhost:27017/trailblazer';
		MongoClient.connect(url, function(err, db) {
			if (err) {
				console.log('Cannot post to database', err);
			}
			else {
				console.log('Retrieving registration information from database');
				var collection = db.collection('registration');
				var user= req.cookies.username;
				collection.find({"username":user}).toArray(function(err, result) {
					if (err){
						console.log(err);
					}
					else {
						res.render('myprofile', {"registration": result});
					}
				db.close();
				});
			}
		});
	} 
	else {
		res.render('login');
	}
});

app.get('/myprofile',function(req,res){
	res.render('myprofile');
});

app.get('/updateProfile',function(req,res){
	if(req.cookies.username) {
		var MongoClient = mongodb.MongoClient;
		var url = 'mongodb://localhost:27017/trailblazer';
		MongoClient.connect(url, function(err, db) {
			if (err) {
				console.log('Cannot post to database', err);
			}
			else {
				console.log('Retrieving registration information from database');
				var collection = db.collection('registration');
				var user= req.cookies.username;
				collection.find({"username":user}).toArray(function(err, result) {
					if (err){
						console.log(err);
					}
					else {
						res.render('updateProfile', {"registration": result});
					}
				});
			};
		});
	}
});

app.post('/updateProfile', function(req,res) {
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/trailblazer';
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Unable to connect to the Server:', err);
		}
		else {
			console.log('Connected to server');
			var collection = db.collection('registration');
			var user= req.cookies.username;
			collection.update(
				{username: "user"},
				{$set: {"profPhoto":"req.body.profPhoto","userdescription":"req.body.userdescription",
					"userexperience":"req.body.userexperience",}
				});
			res.redirect("/myprofile");
		}
		db.close();
	});
});

app.use(function(req, res, next){
	console.log('Looking for URL : ' + req.url);
	next();
});

// Delete a cookie
app.get('/deletecookie', function(req, res){
	res.clearCookie('username');
	res.redirect("/");
});

//Session function
app.use(function(req, res, next){
	var views = req.session.views;
	// If no views initialize an empty array
	if(!views){
		views = req.session.views = {};
	}
	// Get the current path
	var pathname = parseurl(req).pathname;
	// Increment the value in the array using the path as the key
	views[pathname] = (views[pathname] || 0) + 1;
	next();
});

// You can also report and throw errors
app.get('/junk', function(req, res, next){
	console.log('Tried to access /junk');
	throw new Error('/junk does\'t exist');
});

// Catches the error and logs it and then continues down the pipeline 
app.use(function(err, req, res, next){
	console.log('Error : ' + err.message);
	next();
});

//Custom 404 Page
app.use(function(req, res) {
	res.type('text/html');
	res.status(404);
	// Point at the 404.handlebars view
	res.render('404');
});

// Custom 500 Page
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	// Point at the 500.handlebars view
	res.render('500');
});


app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' +
	app.get('port') + '; press Ctrl-C to terminate');
});


