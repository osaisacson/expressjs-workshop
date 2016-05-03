var express = require('express');
var app = express();
var bodyParser = require('body-parser'); //reads a form's input and stores it as a javascript object accessible through `req.body` 
var cookieParser = require('cookie-parser');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var redditAPI = require('./reddit.js')();
app.use(cookieParser());
app.use(bodyParser());


//FUNCTIONS
function sayHelloTo(name) {
  return "<h1>Hello _" + name + "_!</h1>";
}

function add(num1, num2) {
  return num1 + num2;
}

function sub(num1, num2) {
  return num1 - num2;
}

function mult(num1, num2) {
  return num1 * num2;
}

function div(num1, num2) {
  return num1 / num2;
}


//app.use's
app.use(function(req, res, next) { //Middleware. This particular bit will run for every request done (because we are using 'use').
  console.log(req.cookies);
  next();
});


//EXERCISES

//Exercise 1: Create a web server that can listen to requests for /hello, and respond with some HTML that says <h1>Hello World!</h1>
app.get('/hello', function(req, res) { //if you detect any incoming requests where the method is get, then run this function. request is like the input to your function. response is an object with what you send(specific to the stuff you're trying to do). send is like return. 
  if (req.cookies.nameOfUser) {
    res.send('Welcome back' + req.cookies.name.nameOfUser + '!');
  }
  else {
    res.send('Hello World!');
  }
});


//Exercise 2: Create a web server that can listen to requests for /hello?name=firstName, and respond with some HTML that says <h1>Hello _name_!</h1>. For example, if a client requests /hello/John, the server should respond with <h1>Hello John!</h1>
app.get('/hello/:name', function(req, res) {
  var name = req.params.name;
  var result = sayHelloTo(name);
  res.send(result);
});

//alternatively...
app.get('/hello2', function(req, res) {
  var name = req.query.name;
  res.cookie('nameOfUser', name); //stores the name var in a cookie, will send that cookie for every following request (nameOfUser=(the name you will enter in the response))
  res.send('<h1>Hello' + name + '!</h1>');
});


//Exercise 3: Create a web server that can listen to requests for /calculator/:operation?num1=XX&num2=XX and respond with a JSON object
app.get('/calculator/:operation/:num1/:num2', function(req, res) {
  var operation = req.params.operation; //identifies where we want to go in the object
  var num1 = Number(req.params.num1); //converts our string to a number, says where it is and assigns it to the var num 1
  var num2 = Number(req.params.num2);
  var result;
  if (operation === "add") {
    var solution = add(num1, num2);
    result = solution;
  }
  else if (operation === "sub") {
    var solution = sub(num1, num2);
    result = solution;
  }
  else if (operation === "mult") {
    var solution = mult(num1, num2);
    result = solution;
  }
  else if (operation === "div") {
    var solution = div(num1, num2);
    result = solution;
  }
  else {
    result = "error";
  }

  var fullAnswer = {
    "operator": operation,
    "firstOperand": num1,
    "secondOperand": num2,
    "solution": result
  };

  if (result === "error") {
    res.status(404).send("nat warking");
  }
  else {
    res.send(fullAnswer); //takes our answer and sends it to the page. 
  }
});

//...alternatively
app.get('/calculator/:operation*?', function(request, response) { //the operation is part of the resource path, as the add, subtract, mult, div are dynamic and represented as functions.
  if (!request.params.operation) {
    response.status(400).send('you have to pass an operation');
    return;
  }
  var operation = request.params.operation; //refers to the dynamic 'operation' part above (indicated by the : and the use of params), and says to store the particular request the user makes (add...) in the var 'operation'.
  var num1 = request.query.num1; //
  var num2 = request.query.num2;
  if (operation === 'add') {
    response.send({
      op: 'add',
      n1: num1,
      n2: num2,
      result: num1 + num2
    });
  }
  else {
    response.status(400).send({
      error: 'bad operation'
    });
  }
});


//Exercise 4: Retrieving data from our database
app.get('/posts', function(request, response) {
  redditAPI.getAllPosts(function(err, posts) {
    if (err) {
      response.status(500).send('oops, try again later')
    }
    else {
      var listItems = posts.map(function(post) {
        return '<li><a href="' + post.url + '">' + post.title + '</a>' + /*moment(post.createdAt).fromNow('') +*/ '</li>';
        //can also use template stream literals: means you can put variables inside the stream as post.title etc
      });
      response.send('<ul>' + listItems.join(' ') + '</ul>');
    }
  })
})


//Exercise 5: In this exercise, we're going to use Express to simply send an HTML file to our user containing a <form>
app.get('/createContent', function(req, res) {

  var options = {
    root: __dirname + '/'
  };

  //var fileName = req.params.name;
  res.sendFile('form.html', options, function(err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', 'form.html');
    }
  });


});


//Exercise 6: Receiving data from our form. In this exercise, we will write our first POST endpoint. The resource will be the same, /createContent, but we will be writing a second endpoint using app.post instead.
app.post('/createContent', function(req, res) {

  console.log(req.body);
  var title = req.body.title;
  var URL = req.body.url;

  redditAPI.createPost({
    userId: 1,
    url: URL,
    title: title
  }, function(err, posts) {
    res.send(posts);
  });
  //here call the function that insert the title and URL to mySQL

  res.send("OK");
});



//REDDIT PAGES

//Homepage:
app.get('/resource/:sort', function(request, response) { //sets a choice to pass a sort function to the page.
  var sort = request.params.sort; //refers to the dynamic 'sort' part above (indicated by the : and the use of params), and says to store the particular request the user makes (add...) in the var 'sort'.

  if (sort === 'topPosts') { //if the sort option is identified as 'topPosts'...
    redditAPI.getTopPosts(function(err, result) { //...call the getTopPosts function
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result);
      }
    });
  }
  
  else if (sort === 'hotPosts') { //if the sort option is identified as 'hotPosts'...
    redditAPI.getHotPosts(function(err, result) { //...call the function
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result);
      }
    }); //...call the function
  }
  
  else if (sort === 'newPosts') { 
    redditAPI.getNewPosts(function(err, result) { //...call the function
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result);
      }
    });
  }
  
  else if (sort === 'controversialPosts') { //if the sort option is identified as 'controversialPosts'...
    redditAPI.getControversialPosts(function(err, result) { //...call the function
      if (err) {
        response.status(500).send("Try again later.");
      }
      else {
        response.send(result);
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

//SignUp
app.get('/signup', function(request, response) {
//The signup page will be a simple page with an HTML <form>. 
//The form will have username and password fields, as well as a "signup" submit button.
});

//SignUp
app.get('/login', function(request, response) {
//The login page will be a simple page with an HTML <form>. 
//The form will have username and password fields, as well as a "login" submit button.
});

//SignUp
app.get('/createpost', function(request, response) {
//The create post page will also be a simple page with an HTML <form>. 
//The form will have title and URL fields, as well as a "create" submit button.
});




/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
