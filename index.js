var express = require('express');
var app = express();
var bodyParser = require('body-parser'); //reads a form's input and stores it as a javascript object accessible through `req.body` 
var cookieParser = require('cookie-parser');
var mysql = require('mysql');
//var bcrypt = require('bcrypt');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'iblameyourmother',
  password : '',
  database: 'reddit'
});

var redditAPI = require('./js/reddit.js')(connection);

//USE
app.use(cookieParser());

app.use(bodyParser());

app.use(function(req, res, next) { //Middleware. This particular bit will run for every request done (because we are using 'use').
  console.log(req.cookies);
  next();
});


////////////////////////////////////////REDDIT PAGES/////////////////////////////////////////////////////////////////

//HOMEPAGE(resources)
app.get('/resource/:sort', function(request, response) { //sets a choice to pass a sort function to the page.
  var sort = request.params.sort; //sets a 'sort' variable that contains the particular sort parameter that was indicated in the request (request.params.sort is like a map that guides us to where to find the info we store)

  //options for the 'sort' parameter of the /resource path: 'topPosts', 'hotPosts', 'newPosts', 'controversialPosts'
  if (sort === 'topPosts') { //if the sort option is identified as 'topPosts'...
    redditAPI.getTopPosts(function(err, result) { //go to redditAPI and call the getTopPosts function. then pass the results of that function to this callback.
    
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result); //respond to the user with the result of the function we passed above.
      }
    });
  }

  else if (sort === 'hotPosts') { //if the sort option is identified as 'hotPosts'...
    redditAPI.getHotPosts(function(err, result) { //go to redditAPI and call the getHotPosts function. then pass the results of that function to this callback.
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result); //respond to the user with the result of that function.
      }
    }); //...call the function
  }

  else if (sort === 'newPosts') {
    redditAPI.getNewPosts(function(err, result) { //go to redditAPI and call the getNewPosts function.
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result); //respond to the user with the result of that function.
      }
    });
  }

  else if (sort === 'controversialPosts') { //if the sort option is identified as 'controversialPosts'...
    redditAPI.getControversialPosts(function(err, result) { //go to redditAPI and call the getControversialPosts function.
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result); //respond to the user with the result of that function.
      }
    });
  }

  else {
    response.send({
      success: true,
      result: 'bad operation'
    });
  }

});


//SIGN UP
app.get('/signup', function(request, response) {

  //The signup page will be a simple page with an HTML <form>. 
  //The form will have username and password fields, as well as a "signup" submit button.

  //Send me the signup.html file:
  var options = {
    root: __dirname + '/html', //you'll find the file you're looking for in the /html folder.
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  response.sendFile('signup.html', options, function(err) {
    if (err) {
      console.log(err);
      response.status(err.status).end();
    }
    else {
      console.log('Sent:', 'signup.html'); //otherwise, console.log sent:signup.html
      return; //and return the login.html file to the user.
    }
  });

  //redirect me to the login page, so we don't send the form info twice.
  response.redirect('/login');
});


//LOG IN
app.get('/login', function(request, response) {

  //Send me the login.html file:
  var options = {
    root: __dirname + '/html', //you'll find the file you're looking for in the /html folder.
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  response.sendFile('login.html', options, function(err) { //in the response to the user, take the file, its options and...
    if (err) {
      console.log(err);
      response.status(err.status).end(); //if error, respond with error status.
    }
    else {
      console.log('Sent:', 'login.html'); //otherwise, console.log sent:login.html
      return; //and return the login.html file to the user.
    }
  });

  //redirect me to the home page, so we don't send the form info twice.
  response.redirect('/resource');
});


//CREATE POST
app.get('/createpost', function(request, response) {

  //Send me the createpost.html file:
  var options = {
    root: __dirname + '/html',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  response.sendFile('createpost.html', options, function(err) {
    if (err) {
      console.log(err);
      response.status(err.status).end();
    }
    else {
      console.log('Sent:', 'createpost.html');
      return;
    }
  });

  //redirect me to the login page, so we don't send the form info twice.
  response.redirect('/login');
});




/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
