var express = require('express');
var React = require('react');
var ReactDOM = require('react-dom');
var render = require('react-dom/server').renderToStaticMarkup;
var moment = require('moment');
var app = express();



//////////MAIN RENDER FUNCTION/////////////////
function renderLayout(pageTitle, isLoggedIn, content) { //you can add or delete the isLoggedIn if you don't want to use it. it could be used for adding more buttons, for example, if the user is logged in or not.
    //html = html + "<body><nav>... isLoggedIn ? some buttons : different buttons</nav>...<main>" + content + "</main> <footer>...</footer> </html>";
    return (`
     <!doctype>
        <html>
            <head>
                <title>${pageTitle}</title>
                <link rel="stylesheet" href="/css/app.css"/>
                <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Raleway" />            </head>
            <body>
                <header>
                    <nav>
                        <ul>
                            <li><a href="https://reddit-clone-iblameyourmother.c9users.io/posts">TOP POSTS</a></li>
                            <li><a href="https://reddit-clone-iblameyourmother.c9users.io/signup">SIGNUP</a></li>
                            <li><a href="https://reddit-clone-iblameyourmother.c9users.io/login">LOGIN</a></li>
                            <li><a href="https://reddit-clone-iblameyourmother.c9users.io/createPost">CREATE POST</a></li>
                        </ul>
                    </nav
                </header>
                    ${content}
                <footer>
                </footer>
            </body> 
    `);
}
//renderLayout shows both the stuff we always want to be there + adds our unique content. 
//what we pass it is the stuff we want to change.
//'pageTitle' is the title 
//'content' is what we want changed for each page, 


////////////////////PAGES/////////////////////////////

//LOG IN
function loginInHTML() {

    return (`
        <div class="cover">
            <form class="login-signup" action="/login" method="POST">
                    <input required type="text" name="username" placeholder="username">
                    <input required type="password" name="password" placeholder="password">
                    <button class="myButton">LOGIN</button>
            </form>
        </div>`);

}

//SIGN UP
function signupInHTML() {
    return (`
    <div class="cover">
            <form class="login-signup" action="/login" method="POST">
                    <input required type="text" name="username" placeholder="enter a username">
                    <input required type="password" name="password" placeholder="enter a password">
                    <button class="myButton">WELCOME</button>
            </form>
        </div>`);
}

//CREATE POST
function createPostInHTML() {
    return (`
        <div class="cover"> 
            <form class="createpost" action="/createPost" method="POST">
                <input type="text" name="url" placeholder="add a link to your content">
                <input required type="text" name="title" placeholder="enter the title of your content">
                <input required type="text" name="content" placeholder="what do you want to say?">
                <button class="myButton-posting" type="submit">POST THAT AWESOME POST</button>
            </form>
        </div>`);
}

//VOTE FOR A POST - WILL BE CALLED INSIDE 'VIEW SINGLE POST'
function voteForm(post) {
    return (`
            <div class="cover"> 
                <form class="createpost" action="/vote" method="post" >
                    <input type="hidden" name="vote" value="1" />
                    <input type="hidden" name="postId" value=${post.postID} />
                    <button class="myButton" type="submit"><span>upvote this</span></button>
                </form>
                <form class="createpost" action="/vote" method="post">
                    <input type="hidden" name="vote" value="-1" />
                    <input type="hidden" name="postId" value=${post.postID} />
                    <button class="myButton" type="submit"><span>downvote this</span></button>
                </form>
            </div>
    `);
}

//VIEW SINGLE POST 
function singlePost(post) {
    //makes the var voteForm (which gives us the voting functionality) accessible within the return below.
    return (`
        <div className = 'post'>
            <h1>${post.title}</h1>
            <div>
                <p>user: ${post.user.username} <br />
                    url: ${post.url} <br />
                    content: ${post.content} <br />
                    created: ${moment(post.createdAt).fromNow()} <br />
                </p>
            </div>
            <div className = 'vote'>
            ${voteForm(post)}
            </div>
        </div>
    `);
}
function PostList(data) {

//VIEW TOP POSTS
    var PostItems = data.map(function(item) { //use map on our posts
        return <Post url={`https://reddit-clone-iblameyourmother.c9users.io/post?postId=${item.id}`} title={item.title} />;
    });
    
        function Post(dataTwo) {
        return (
        <li>
            <h2>
            <a href={dataTwo.url}>{dataTwo.title}</a>
            </h2>
        </li>
        );
    }

    return (
        <div id="posts">
      <h1>TOP POSTS</h1>
      <ul>
        {PostItems} 
      </ul> 
    </div>
    );
}



//////EXPORTING OUR FUNCTIONS////////
module.exports = {
    PostList: PostList,
    renderLayout: renderLayout,
    loginInHTML: loginInHTML,
    signupInHTML: signupInHTML,
    voteForm: voteForm,
    singlePost: singlePost,
    createPostInHTML: createPostInHTML,
};
