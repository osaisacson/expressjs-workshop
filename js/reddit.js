var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;
var secureRandom = require('secure-random');

function createSessionToken() {
    return secureRandom.randomArray(100).map(code => code.toString(36)).join('');
} //this function needs to be accessible as it's being called by one of our functions within the below object. so we put it here.

module.exports = function RedditAPI(conn) { //creates an object with all the below functions. this means we can later export them all and call them with reference to this object, for example RedditAPI.createUser
    return {

        createUser: function(user, callback) {
            // first we have to hash the password...
            bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
                if (err) {
                    callback(err);
                }
                else {
                    console.log("password hashing succeeded");
                    conn.query(
                        'INSERT INTO users (`username`,`password`, `createdAt`) VALUES (?, ?, ?)', [user.username, hashedPassword, null],
                        function(err, result) {
                            if (err) {
                                /*
                                There can be many reasons why a MySQL query could fail. While many of
                                them are unknown, there's a particular error about unique usernames
                                which we can be more explicit about!
                                */
                                if (err.code === 'ER_DUP_ENTRY') {
                                    callback(new Error('A user with this username already exists'));
                                }
                                else {
                                    callback(err);
                                }
                            }
                            else {
                                /*
                                Here we are INSERTing data, so the only useful thing we get back
                                is the ID of the newly inserted row. Let's use it to find the user
                                and return it
                                */
                                conn.query(
                                    'SELECT `id`, `username`, `createdAt`, `updatedAt` FROM `users` WHERE `id` = ?', [result.insertId],
                                    function(err, result) {
                                        if (err) {
                                            callback(err);
                                        }
                                        else {
                                            callback(null, result[0]);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            });
        },

        checkLogin: function(username, passwordToCheck, callback) { //checkLogin checks if the person that's trying to login already is in our database. It takes the user and password from the request and...
            conn.query(`SELECT * FROM users WHERE username = ?`, [username], function(err, result) { //...says to select all info from the part of the users table where the username we pass it is a match. 

                if (result.length === 0) { //if there is no length to the result (ie there's no result...)
                    callback(new Error('username or password incorrect')); //respond with error message
                }
                else {
                    var user = result[0]; //store the result (the user object returned from mysql)  into the variable 'user', 0 stands for the first object in the array, which is the user object :)
                    var actualHashedPassword = user.password; //store the password from the returned object into the var 'actualHashedPassword'
                    bcrypt.compare(passwordToCheck, actualHashedPassword, function(err, result) { //use bcrypt's compare function: pass it the password we want to check(comes from original arguments we pass when calling the checkLogin function)
                        if (result === true) { //if the result of the bcrypt compare function evaluates to true...
                            callback(null, user); //...pass the var user (our whole user object) to the callback.
                        }
                        else {
                            callback(new Error('username or password incorrect')); //otherwise, pass the callback an error.
                        }
                    });
                }
            });
        },

        createSession: function(userId, callback) {
            var token = createSessionToken();
            conn.query('INSERT INTO sessions SET userId = ?, token = ?', [userId, token], function(err, result) { //insert the following into the sessions table, use the userId and token that will be passed.
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, token); // pass the token to the callback function
                }
            })
        },

        getUserFromSession: function(token, callback) {

            conn.query(`SELECT * FROM sessions WHERE token = ?`, [token], function(err, result) { //...says to select all info from the part of the users table where the username we pass it is a match. 

                if (result.length === 0) { //if there is no length to the result (ie there's no result...)
                    callback(new Error('No current session for that user')); //respond with error message
                }
                else {
                    callback(null, result[0].userId)
                }
            });
        },

        createPost: function(post, callback) {
            conn.query(
                'INSERT INTO `posts` (`userId`, `title`, `url`, `content`, `createdAt`) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, post.content, null], //take the userId, title, url and createdAt of the post and insert it in the posts table.
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        /*
                        Post inserted successfully. Let's use the result.insertId to retrieve
                        the post and send it to the caller!
                        */
                        conn.query(
                            'SELECT `id`,`title`, `url`, `content`, `userId`, `createdAt`, `updatedAt` FROM `posts` WHERE `id` = ?', [result.insertId], //select all these pieces from the posts table where the id matches our result.insertId.
                            function(err, result) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, result[0]);
                                }
                            }
                        );
                    }
                }
            );
        },

        createOrUpdateVote: function(vote, callback) {
            if (vote.vote === 1 || vote.vote === -1 || vote.vote === 0) { //checks if the vote is in the recognized formats.
                conn.query(
                    `INSERT INTO votes SET postId = ?, userId = ?, vote = ?, createdAt = ? ON DUPLICATE KEY UPDATE vote = ?`, [vote.postId, vote.userId, vote.vote, null, vote.vote], //if it is in the right format, insert it in thepostId, userId, vote places in the vote table. If theres a duplicate for vote, replace the vote.vote value with the last value.
                    function(err, result) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            console.log(result);
                            conn.query(
                                `SELECT * FROM votes WHERE userId = ? AND postId = ?`, [vote.userId, vote.postId], //select all from the votes table where userId and postId matches what we gave you.
                                function(err, vote) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        callback(null, vote); //give us the vote result back.
                                    }
                                });
                        }
                    });
            }
            else {
                callback(new Error("Vote must be 1, -1, or 0."));
            }
        },
        
        createComment: function(comment, callback) {
            conn.query(`
            INSERT INTO comments (text, createdAt, parentId, postId, userId) VALUES (?, ?, ?, ?, ?)`, [comment.text, null, comment.parentId, comment.postId, comment.userId],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        conn.query(`
                        SELECT * FROM comments WHERE id = ?`, [result.insertId], //select all from the comments table which matches our passed id.
                            function(err, result) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, result[0]); //return the comment info
                                }
                            });
                    }
                });
        },

        getAllPosts: function(options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            conn.query(`
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts
        JOIN users
        ON users.id=posts.userId
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalresults = results.map(function(current) {
                            var joinedresults = {
                                "id": current.id,
                                "title": current.title,
                                "url": current.url,
                                "createdAt": current.postCreatedAt,
                                "updatedAt": current.postUpdatedAt,
                                "userId": current.postUserId,
                                "user": {
                                    "id": current.userUserId,
                                    "username": current.userName,
                                    "userCreatedAt": current.userCreatedAt,
                                    "userUpdatedAt": current.userUpdatedAt
                                }
                            };
                            return joinedresults;
                        });
                        callback(null, finalresults);
                    }
                }

            );
        },

        getAllPostsForUser: function(userId, options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            conn.query(`
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts 
        JOIN users 
        ON users.id=posts.userId
        WHERE posts.userId= ?
        LIMIT ? OFFSET ? 
        `, [userId, limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalResultUser = results.map(function(current) {
                            var joinedresults = {
                                "id": current.id,
                                "title": current.title,
                                "url": current.url,
                                "postCreatedAt": current.postCreatedAt,
                                "postUpdatedAt": current.postUpdatedAt,
                                "userId": current.postUserId,
                                "user": {
                                    "id": current.userUserId,
                                    "username": current.userName,
                                    "userCreatedAt": current.userCreatedAt,
                                    "userUpdatedAt": current.userUpdatedAt
                                }
                            };
                            return joinedresults;
                        });
                    }
                    callback(null, finalResultUser);
                }
            );
        },

        getSinglePost: function(postId, callback) {

            conn.query(`
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.content AS content, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts 
        JOIN users 
        ON users.id=posts.userId
        WHERE posts.id = ?
        `, [postId],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalResultPost = {
                            "id": results[0].id,
                            "title": results[0].title,
                            "content": results[0].content,
                            "url": results[0].url,
                            "postCreatedAt": results[0].postCreatedAt,
                            "postUpdatedAt": results[0].postUpdatedAt,
                            "userId": results[0].postUserId,
                            "user": {
                                "id": results[0].userUserId,
                                "username": results[0].userName,
                                "userCreatedAt": results[0].userCreatedAt,
                                "userUpdatedAt": results[0].userUpdatedAt
                            }
                        };
                    }
                    callback(null, finalResultPost);
                }
            );
        },

        createSubreddit: function(subreddits, callback) {
            conn.query(
                'INSERT INTO `subreddits` (`name`, `description`) VALUES (?, ?)', [subreddits.name, subreddits.description],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        /*
                        Subreddit inserted successfully. Let's use the result.insertId to retrieve
                        the subreddit and send it to the caller!
                        */
                        conn.query(
                            'SELECT `name`,`description` FROM `subreddits` WHERE `id` = ?', [result.insertId],
                            function(err, result) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, result[0]);
                                }
                            }
                        );
                    }
                })
        },

        getAllSubreddits: function(callback) {
            conn.query(`
        SELECT s.id AS sId, name AS sName, url AS sURL, description AS sDesc, s.createdAt AS sCreatedAt, s.updatedAt AS sUpdatedAt
        FROM subreddits AS s
        ORDER BY s.createdAt DESC
        `, function(err, results) {
                if (err) {
                    callback(err);
                }
                else {
                    var subreddits = results.map(function(results) {
                        var subsObj = {
                            "id": results.sId,
                            "name": results.sName,
                            "url": results.sURL,
                            "createdAt": results.sCreatedAt,
                            "updatedAt": results.sUpdatedAt,
                        };
                        return subsObj;
                    });

                    callback(null, subreddits);
                }
            });
        },

        createComment: function(comment, callback) {
            var ifExists;
            if (comment.parentId) {
                ifExists = comment.parentId;
            }
            else {
                ifExists = null;
            }
            conn.query(
                'INSERT INTO comments (comment, userId, postId, parentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ? );', [comment.text, comment.userId, comment.postId, ifExists, null, null],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        /* Comment inserted successfully. Let's use the result.insertId to retrieve the comment and send it to the caller! */
                        conn.query(
                            'SELECT `id`,`comment`, `userId`, `postId`, `parentId`, `createdAt`, `updatedAt` FROM `comments` WHERE `id` = ?', [result.insertId],
                            function(err, result) {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, result[0]);
                                }
                            }
                        );
                    }
                }
            );
        },

        getComments: function(maxLevel, parentIds, commentsMap, finalComments, callback) {
            //Query declared at top level to build it dynamically.
            var query;

            // need to asign this to that so that I can access the createComment key and use it's value/function
            var that = this;
            if (!callback) {
                // first time function is called
                callback = parentIds;
                parentIds = [];
                commentsMap = {};
                finalComments = [];
                query = 'select * from comments where parentId is null';
            }
            //base case scenario - always necessary for recursive function so it knows when to stop
            else if (maxLevel === 0 || parentIds.length === 0) {
                callback(null, finalComments);
                return;
            }
            else {
                // gets children comments
                query = 'SELECT * FROM comments WHERE parentId in (' + parentIds.join(',') + ')'; // this equates to (1, 2, 3, 4, 5...) ~= where id = 1 or id = 2 or id = 3...
            }
            conn.query(query, function(err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                res.forEach(
                    function(comment) {
                        commentsMap[comment.id] = comment; // set object key to column header
                        if (comment.parentId === null) {
                            finalComments.push(comment);
                        }
                        else {
                            var parent = commentsMap[comment.parentId]; // save parentId as var parent
                            parent.replies = parent.replies || []; // set reply key as existing array or create reply key as empty array
                            parent.replies.push(comment); // push child comment to replies array
                        }
                    }
                );

                var newParentIds = res.map(function(item) {
                    return item.id;
                }); // get next level of parent ids
                // need to use 'that' to access 'this' so the function can be accessed outside of the function
                that.getComments(maxLevel - 1, newParentIds, commentsMap, finalComments, callback); // maxlevel -1 counts down to base case, the function calls itself within the function - recursion
            });
        },

        /////////SORTING FUNCTIONS/////////
        //formula to sort by decreasing vote score(diff between the nr of upvotes and the nr of downvotes
        getTopPosts: function(options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;
            conn.query(`   
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        posts.upvotes AS postUpvotes,
        posts.downvotes AS postDownvotes,
        ABS(posts.upvotes - posts.downvotes) AS diffUpDown,
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts
        JOIN users
        ON users.id=posts.userId
        ORDER BY diffUpDown DESC 
        LIMIT ? OFFSET ?
        `, [limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalresults = results.map(function(current) {
                            var joinedresults = {
                                "id": current.id,
                                "title": current.title,
                                "url": current.url,
                                "createdAt": current.postCreatedAt,
                                "updatedAt": current.postUpdatedAt,
                                "upvotes": current.postUpvotes,
                                "downvotes": current.postDownvotes,
                                "diffUpDown": current.diffUpDown,
                                "userId": current.postUserId,
                                "user": {
                                    "id": current.userUserId,
                                    "username": current.userName,
                                    "userCreatedAt": current.userCreatedAt,
                                    "userUpdatedAt": current.userUpdatedAt
                                }
                            };

                            return joinedresults;
                        });
                        callback(null, finalresults);

                    }
                }

            );
        },

        //formula to sort by hotness: the ratio of the "vote score" to the number of seconds since a post has been created. Given the same number of "vote score", a newer post will get a better "hotness score"
        getHotPosts: function(options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            //formula to sort by decreasing vote score(diff between the nr of upvotes and the nr of downvotes
            conn.query(`   
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts
        JOIN users
        ON users.id=posts.userId
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalresults = results.map(function(current) {
                            var joinedresults = {
                                "id": current.id,
                                "title": current.title,
                                "url": current.url,
                                "createdAt": current.postCreatedAt,
                                "updatedAt": current.postUpdatedAt,
                                "userId": current.postUserId,
                                "user": {
                                    "id": current.userUserId,
                                    "username": current.userName,
                                    "userCreatedAt": current.userCreatedAt,
                                    "userUpdatedAt": current.userUpdatedAt
                                }
                            };
                            return joinedresults;
                        });
                        callback(null, finalresults);

                    }
                }

            );
        },

        //formula to sort the posts by increasing order of createdAt, basically the newest posts first.
        getNewPosts: function(options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            //formula to sort by decreasing vote score(diff between the nr of upvotes and the nr of downvotes
            conn.query(`   
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts
        JOIN users
        ON users.id=posts.userId
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalresults = results.map(function(current) {
                            var joinedresults = {
                                "id": current.id,
                                "title": current.title,
                                "url": current.url,
                                "createdAt": current.postCreatedAt,
                                "updatedAt": current.postUpdatedAt,
                                "userId": current.postUserId,
                                "user": {
                                    "id": current.userUserId,
                                    "username": current.userName,
                                    "userCreatedAt": current.userCreatedAt,
                                    "userUpdatedAt": current.userUpdatedAt
                                }
                            };
                            return joinedresults;
                        });
                        callback(null, finalresults);

                    }
                }

            );
        },

        //formula to sort by if it has almost as many upvotes as it has downvotes.The more of each it has the better! perhaps something like min(numUpvotes, numDownvotes) / (numUpvotes - numDownvotes)^2?
        getControversialPosts: function(options, callback) {
            // In case we are called without an options parameter, shift all the parameters manually
            if (!callback) {
                callback = options;
                options = {};
            }
            var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
            var offset = (options.page || 0) * limit;

            //formula to sort by decreasing vote score(diff between the nr of upvotes and the nr of downvotes
            conn.query(`   
        SELECT 
        posts.id AS id, 
        posts.title AS title, 
        posts.url AS url, 
        posts.userId AS postUserId, 
        posts.createdAt AS postCreatedAt, 
        posts.updatedAt AS postUpdatedAt, 
        users.id AS userUserId, 
        users.username AS userName, 
        users.createdAt AS userCreatedAt, 
        users.updatedAt AS userUpdatedAt
        FROM posts
        JOIN users
        ON users.id=posts.userId
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalresults = results.map(function(current) {
                            var joinedresults = {
                                "id": current.id,
                                "title": current.title,
                                "url": current.url,
                                "createdAt": current.postCreatedAt,
                                "updatedAt": current.postUpdatedAt,
                                "userId": current.postUserId,
                                "user": {
                                    "id": current.userUserId,
                                    "username": current.userName,
                                    "userCreatedAt": current.userCreatedAt,
                                    "userUpdatedAt": current.userUpdatedAt
                                }
                            };
                            return joinedresults;
                        });
                        callback(null, finalresults);

                    }
                }

            );
        },
        
    };
};