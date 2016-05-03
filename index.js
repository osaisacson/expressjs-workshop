var express = require('express');
var bodyParser = require('body-parser'); //reads a form's input and stores it as a javascript object accessible through `req.body` 
var app = express();
app.use(bodyParser());


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

function


app.get('/hello', function(req, res) {
  res.send('Hello World!');
});

app.get('/hello/:name', function(req, res) {
  var name = req.params.name;
  var result = sayHelloTo(name);
  res.send(result);
});

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
    result = "error"
  }

  var fullAnswer = {
    "operator": operation,
    "firstOperand": num1,
    "secondOperand": num2,
    "solution": result
  };

  if (result === "error") {
    res.status(404).send("your shiat don't work")
  }
  else {
    res.send(fullAnswer); //takes our answer and sends it to the page. 
  }
});

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





app.post('/createContent', function(req, res) {

  console.log(req.body)
  var title = req.body.title;
  var URL = req.body.url;
  
  //call the function that insert the title and URL to mySQL
  
  res.send("OK");
});



/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
