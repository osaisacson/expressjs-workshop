var voteForm = `
 <form action="/vote" method="post">
  <input type="hidden" name="vote" value="1">
  <input type="hidden" name="postId" value="XXXX">
  <button type="submit">upvote this</button>
</form>
<form action="/vote" method="post">
  <input type="hidden" name="vote" value="-1">
  <input type="hidden" name="postId" value="XXXX">
  <button type="submit">downvote this</button>
</form>`;
module.exports = voteForm;