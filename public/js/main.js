/* global $ */

$(document).ready(function() {
            $('#posts a').on('click', function(event) {
            event.preventDefault();
            var $this = $(this);
            var encode = $this[0].toString();
            var postId = encode.substring(encode.indexOf('?'), encode.length);
      $.get(`/post${postId}`, function(result){
          $('#singlePost').remove();
          $('#allcontent').append(result);
   
      });
 
    });
  }); //when clicking a link on the post page, show the relevant post.
  