var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

module.exports = function RedditAPI(conn) {
    return {
        
        createUser: function(user, callback) {

            // first we have to hash the password...
            bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
                if (err) {
                    callback(err);
                }
                else {
                    conn.query(
                        'INSERT INTO `users` (`username`,`password`, `createdAt`) VALUES (?, ?, ?)', [user.username, hashedPassword, null],
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
                                            /*
                                            Finally! Here's what we did so far:
                                            1. Hash the user's password
                                            2. Insert the user in the DB
                                            3a. If the insert fails, report the error to the caller
                                            3b. If the insert succeeds, re-fetch the user from the DB
                                            4. If the re-fetch succeeds, return the object to the caller
                                            */
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
        
        createPost: function(post, callback) {
            conn.query(
                'INSERT INTO `posts` (`userId`, `title`, `url`, `createdAt`) VALUES (?, ?, ?, ?)', [post.userId, post.title, post.url, null],
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
                            'SELECT `id`,`title`,`url`,`userId`, `createdAt`, `updatedAt` FROM `posts` WHERE `id` = ?', [result.insertId],
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
        WHERE posts.id= ?
        `, [postId],
                function(err, results) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var finalResultPost = {
                            "id": results[0].id,
                            "title": results[0].title,
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
                }
            );
        };

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