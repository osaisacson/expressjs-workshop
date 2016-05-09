var express = require('express');
var React = require('react');
var ReactDOM = require('react-dom');
var render = require('react-dom/server').renderToStaticMarkup;
var moment = require('moment');
var app = express();


//////////ALL BITS THAT WILL TURN TO HTML/////////////////

function PostList(data) {

    var postItems = data.map(function(item) { //use map on our posts
        return (<Post url={item.url} title={item.title} voteScore={item.voteScore}/>)
    });

    return (
        <div>
      <h1>Posts page!</h1>
      <ul>
        {postItems} 
      </ul> 
    </div>
    );
}

function Post(data) {
    return (
        <li>
      <h2>
        <a href={data.url}>{data.title}</a> (score: {data.voteScore})
      </h2>
    </li>
    );
}





module.exports = {
    PostList: PostList,
};