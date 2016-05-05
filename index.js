var express = require('express');
var app = express();
var bodyParser = require('body-parser'); //reads a form's input and stores it as a javascript object accessible through `req.body` 
var cookieParser = require('cookie-parser');
var mysql = require('mysql');
var bcrypt = require('bcrypt');



// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'iblameyourmother',
  password: '',
  database: 'reddit'
});

var redditAPI = require('./js/reddit.js')(connection);

//USE - runs for all requests
app.use(bodyParser());
app.use(function(req, res, next) { //Middleware. This particular bit will run for every request done (because we are using 'use').

  next();
});
app.use(cookieParser()); // adds a `cookies` property to the request (requests.cookies), an object of key:value pairs for all the cookies we set

function checkLoginToken(request, response, next) {

  // check if there's a SESSION cookie...
  if (request.cookies.SESSION) { //the SESSION comes from the login bit below. This now checks if there currently is a SESSION in the request.
    redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) { //pass the current session (request.cookies.SESSION) to the function getUserFromSession, together with a callback that tells what to do with the result we get back.

      if (user) { //checks if there is a user

        request.loggedInUser = user; //sets the logged in user to user
      }
      next();
    });
  }
  else {
    // if no SESSION cookie, move forward to the next middleware or action.
    next();
  }
}

app.use(checkLoginToken);




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
      response.status(err.status).end();
    }
    else {
      console.log('Sent:', 'signup.html'); //console.log sent:signup.html
      return; //return the signup.html file to the user.
    }
  });
});

app.post('/signup', function(request, response) {
  var user = request.body.username;
  var password = request.body.password;

  redditAPI.createUser({
    username: user,
    password: password
  }, function(err, result) {

    if (err) {
      response.send(" " + err);
    }
    else {
      response.redirect('/login'); //redirect me to the login page, so we don't send the form info twice.
    }
  });
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
      response.status(err.status).end(); //...either respond with an error message
    }
    else {
      console.log('Sent:', 'login.html'); //...or console.log sent:login.html,
      return; //and return the login.html file to the user.
    }
  });
});

app.post('/login', function(request, response) {
  var username = request.body.username; //store the username the user is entering into a var called 'username'
  var password = request.body.password;

  redditAPI.checkLogin(username, password, function(err, user) { //pass the var user and var password to the checkLogin function, which 

    if (err) {
      response.status(401).send('Username or password incorrect');
    }
    else {
      redditAPI.createSession(user.id, function(err, token) { //call the createSession function(which checks if the user's entered details match those in our database), pass it the id of the user and a callback that defines what to do with the result
        if (err) {
          response.status(500).send('an error occurred. please try again later!');
        }
        else {
          response.cookie('SESSION', token); // sends the token to the user's cookie pile, names it 'SESSION'
          response.redirect('/resource/topPosts'); //redirect me to the login page, so we don't send the form info twice.
        }
      });

    }
  });
});


//CREATE POST
app.get('/createpost', function(request, response) {
  console.log(request.loggedInUser, "HERE BE HE")

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
    }
  });

});

app.post('/createPost', function(request, response) {

  if (!request.loggedInUser) { //checks if the user is logged in
    // HTTP status code 401 means Unauthorized
    response.status(401).send('You must be logged in to create content!');
  }
  else { //if it comes here, it means that there actually is a request.loggedInUser...which means we have a logged in user.
    //console.log(request.loggedInUser);
    redditAPI.createPost({
      title: request.body.title, 
      content: request.body.content,
      url: request.body.url,
      userId: request.loggedInUser //pass the id of the logged in user to the userId of the post (associate this id with the post).
    }, function(err, post) {
      if (err){
        console.log(err.stack);
          response.status(500).send('an error occurred. please try again later!');
      }
      else {
      response.send(post);
      }
    });
  }
});





/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});