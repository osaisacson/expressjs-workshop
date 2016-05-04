// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'iblameyourmother',
  password : '',
  database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

// It's request time!
/*redditAPI.createUser({
  username: 'hello242',
  password: 'xxx'
}, function(err, user) {
  if (err) {
    console.log(err);
  }
  else {
    redditAPI.createPost({
      title: 'hi reddit!',
      url: 'https://www.reddit.com',
      userId: user.id
    }, function(err, post) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(post);
      }
    });
  }
});*/

redditAPI.createSubreddit({name:"jahdkf", description:"ljfsdrrlfj sdklfjsdfl sdlkfjsdlc"}, function(err, res){
  if(err){
    console.log(err)
  } else {
    console.log(res)
  }
});








-- This creates the users table. The username field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(60) NOT NULL, -- why 60??? ask me :)
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- This creates the posts table. The userId column references the id column of
-- users. If a user is deleted, the corresponding posts' userIds will be set NULL.
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(300) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `subredditId` int(11) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `posts_ibfk_1` 
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subredditId`) REFERENCES `subreddits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



--When adding to already existing table...

mysql> ALTER TABLE posts ADD subredditId INT;

mysql> ALTER TABLE posts ADD FOREIGN KEY (`subredditId`) REFERENCES `subreddits` (`id`) ON DELETE SET NULL;                             
Query OK, 3 rows affected (0.04 sec)


-- This creates the subreddits table. The name field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE `subreddits` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `description` VARCHAR(200),
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;