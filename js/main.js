function switchJoin() {
    $('#logForm').html('<input type="text" name="uName" placeholder="username" required><input type="email" name="email" placeholder="email" required><input type="password" name="pass1" placeholder="password" required><input type="password" name="pass2" placeholder="confirm password" required><input type="submit" value="JOIN" class="button log" id="joinButton">');
    $('#signHead').html('SIGN UP');
};



/*
var socket = io();
$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(msg));
});
*/
