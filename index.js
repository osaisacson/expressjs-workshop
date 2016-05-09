// load our API and pass it the connection
var reddit = require('./js/reddit.js');


//mysql
var mysql = require('mysql');

//react
var React = require('react');
var ReactDOM = require('react-dom');
var render = require('react-dom/server').renderToStaticMarkup;

//express
var express = require('express');
var app = express();
app.use(express.static('public'));

//bodyparser - reads a form's input and stores it as a javascript object accessible through `req.body`.
var bodyParser = require('body-parser');
app.use(bodyParser());

//cookieparser - helps us make a cookie.
var cookieParser = require('cookie-parser');
app.use(cookieParser()); // adds a `cookies` property to the request (requests.cookies), an object of key:value pairs for all the cookies we set
app.use(checkLoginToken);

//bcrypt
var bcrypt = require('bcrypt');

//render
var render = require('react-dom/server').renderToStaticMarkup;

//import forms
var voteForm = require('./js/vote.js');

//load all react and styling functions
var makeHTML = require('./js//makeHTML.js');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'iblameyourmother',
  password: '',
  database: 'reddit'
});
var redditAPI = require('./js/reddit.js')(connection);

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});


//////////////////Functions that will run from this doc///////////////////
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

////////////////////////////////////////REDDIT PAGES/////////////////////////////////////////////////////////////////

//RESOURCE
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
//this bit sends the signup page to the user:
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
//this bit takes the input the user gives, puts it in the user table (by calling the createUser function), and sends back a response to the user (in this case a redirect to the login page)
app.post('/signup', function(request, response) {
  var user = request.body.username;
  var password = request.body.password;

  redditAPI.createUser({ //the createUser function takes an object and a callback. The callback defines what we want done with the result it will give us.
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
//this bit sends the login page to the user:
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
//this bit takes the input the user gives, checks it against the user table (by calling the checkLogin function), and sends back a response to the user (in this case a redirect to the resource/topPosts page)
app.post('/login', function(request, response) {
  var username = request.body.username; //store the username the users client is entering into a var called 'username'
  var password = request.body.password;

  redditAPI.checkLogin(username, password, function(err, user) { //pass the var user and var password to the checkLogin function. 

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
//sends the createpost page to the user:
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
    }
  });

});
//checks if we already have a logged in user (in which case they're allowed to create a post(via the createPost function)), and sends back the post they just created.
app.post('/createPost', function(request, response) {
  if (!request.loggedInUser) {
    response.status(401).send('LOG IN!!! YOU MUST BE LOGGED IN!');
  } //checks if the user is logged in. if they are, they are allowed to create a post.
  else { //if it comes here, it means that there actually is a request.loggedInUser...which means we have a logged in user.
    redditAPI.createPost({ //createPost takes an object and a callback, the callback identifies what we will do with the result the function will give us.
      title: request.body.title,
      content: request.body.content,
      url: request.body.url,
      userId: request.loggedInUser //pass the id of the logged in user to the userId of the post (associate this id with the post).
    }, function(err, post) {
      if (err) {
        response.status(500).send('an error occurred. please try again later!');
      }
      else {
        response.send(post); //send the info of the createPost function we just ran.
      }
    });
  } //send user to the post they just created.
});


//SHOW SINGLE POST
app.get('/post', function(request, response) { //get the post page.
  var postId = Number(request.query.postid); //sets the var postId to the postId identified in the request.

  redditAPI.getSinglePost(postId, function(err, post) { //calls the getSinglePost function, which takes a postId and a callback that says what to do with the result.
    if (err) {
      response.send("<h2>Nope, there ain't no such thang. This is your error: </h2>" + err);
    } //no such post.
    else {
      response.send(post); //give us back the post object that matches the postid we gave it.
    }
  });
}); //shows us one single post, as an object. 
//OBS: needs to be passed a postId somehow.


//VOTE
app.post('/vote', function(request, response) {
  if (!request.loggedInUser) { 
    response.status(401).send('You must be logged in to vote, UNAUTHORIZED! UNAUTHORIZED!');
  } //checks if the user is logged in
  else { //if the user is logged in then they are allowed to vote.
    redditAPI.createOrUpdateVote({ //calls the createOrUpdateVote function, which takes an object and a callback that says what we are to do with the result.
      vote: Number(request.body.vote), //turns the vote to a number instead of string,identifies the vote in the body of the request as the 'vote' of the object.
      postId: Number(request.body.postId), //turns the postId into a number instead of string
      userId: request.loggedInUser, //pass the id of the logged in user to the userId of the post (associate this id with the post).
    }, function(err, votedPosts) {
      if (err) {
        response.status(500).send('an error occurred. please try again later!');
      }
      else {
        redditAPI.getSinglePost(votedPosts[0].postId, function(err, post) { //passes the postId item of the votedPosts object, and a callback, to the getSinglePost function.
          if (err) {
            response.status(500).send('Something went wrong. You done BAD. BAD USER.');
          }
          else {
            if (Number(request.body.vote) === -1) {
              var voteArrow = "down";
            }
            else {
              voteArrow = "up";
            }
            response.send("Thanks for voting!");
          }

        });
      }
    })
  }
});

app.get('/posts', function(request, response) {
    redditAPI.getAllPosts(function(err, posts) {
        if (err) {
            response.status(500).send('try again later!');
        }
        else {
          console.log(posts);
            var htmlStructure = makeHTML.PostList({
                posts: posts
            }); // calling the function that "returns JSX"
            var html = render(htmlStructure); // rendering the JSX "structure" to HTML
            response.send(html);
        }
    });
});
