var socket = io();

var intval = null;
var pos = 0;

$(document).ready(function() {
	$('#mainBigBox').height($('#mainSmallBox').height() + 1);
	$('body').on('mouseenter', '.avatar', function() {
		$('#infoBox').show();
		$('#infoBox #displayName').text('DJ ' + $(this).data('uname'));
	}).on('mouseleave', '.avatar', function() {
		$('#infoBox').hide();
	});
});

$('#settings').change(function() {
	if ($(this).val() == "logOut") {
		window.location.href = "/logout";
	}
});

socket.on('removeMyDj', function (data) {
	var djNum = data.djNumber;
	var i = djNum;
	var addDjAdded = false;
	for(; i < 5;) {
		i = parseInt(i);
		console.log(i);
		if($('#dj' + parseInt(i + 1)).length) {
			console.log('next one exists');
			if($('#dj' + parseInt(i + 1)).hasClass('avatar')) {
				console.log('next one is an avatar');
				$('#dj' + i).attr('class', $('#dj' + parseInt(i + 1)).attr('class'));
				$('#dj' + i).attr('style', $('#dj' + parseInt(i + 1)).attr('style'));
				$('#dj' + i).data('uname', $('#dj' + parseInt(i + 1)).data('uname'));
			}
			else {
				console.log('next one is a regular spot');
				if(addDjAdded) {
					$('#dj' + i).attr('class', 'djSpot');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
				}
				else {
					$('#dj' + i).attr('class', 'djSpot addDj');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
					addDjAdded = true;
				}
			}
		}
		else {
			console.log('next one does not exist');
			if(addDjAdded) {
				console.log('must be a regular spot');
				$('#dj' + i).attr('class', 'djSpot');
				$('#dj' + i).attr('style', '');
				$('#dj' + i).data('uname', '');
			}
			else {
				console.log('must be an addDj');
				$('#dj' + i).attr('class', 'djSpot addDj');
				$('#dj' + i).attr('style', '');
				$('#dj' + i).data('uname', '');
				addDjAdded = true;
			}
		}
	i++;
	}
});

socket.on('removeDj', function (data) {
	var djNum = data.djNumber;
	var i = djNum;
	var addDjAdded = false;
	for(; i < 5;) {
		i = parseInt(i);
		//if you are a dj
		if($('#stopDj').is(":visible")) {
			if($('#dj' + parseInt(i + 1)).length) {
				if($('#dj' + parseInt(i + 1)).hasClass('avatar')) {
					$('#dj' + i).attr('class', $('#dj' + parseInt(i + 1)).attr('class'));
					$('#dj' + i).attr('style', $('#dj' + parseInt(i + 1)).attr('style'));
					$('#dj' + i).data('uname', $('#dj' + parseInt(i + 1)).data('uname'));
				}
				else {
					$('#dj' + i).attr('class', 'djSpot');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
				}
			}
			else {
				$('#dj' + i).attr('class', 'djSpot');
				$('#dj' + i).attr('style', '');
				$('#dj' + i).data('uname', '');
			}
		}
		//if you aren't
		else {
			console.log(i);
			console.log('not a dj');
			if($('#dj' + parseInt(i + 1)).length) {
				console.log('next one exists');
				if($('#dj' + parseInt(i + 1)).hasClass('avatar')) {
					console.log('next one is an avatar');
					$('#dj' + i).attr('class', $('#dj' + parseInt(i + 1)).attr('class'));
					$('#dj' + i).attr('style', $('#dj' + parseInt(i + 1)).attr('style'));
					$('#dj' + i).data('uname', $('#dj' + parseInt(i + 1)).data('uname'));
				}
				else if($('#dj' + parseInt(i + 1)).hasClass('addDj')) {
					console.log('next one is an addDj');
					$('#dj' + i).attr('class', 'djSpot addDj');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
					addDjAdded = true;
				}
				else {
					console.log('next one is a regular spot');
					$('#dj' + i).attr('class', 'djSpot');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
				}
			}
			else {
				console.log('next one does not exist');
				if(addDjAdded) {
					console.log('must be a regular spot');
					$('#dj' + i).attr('class', 'djSpot');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
				}
				else {
					console.log('must be an addDj');
					$('#dj' + i).attr('class', 'djSpot addDj');
					$('#dj' + i).attr('style', '');
					$('#dj' + i).data('uname', '');
					addDjAdded = true;
				}
			}
		}
	i++;
	}
});

socket.on('songEmitComplete', function (data) {
	if(data.result='success') {
		$('#songPop').html('<form id="songForm"><i class="fi-info" id="hintHelper"></i><div class="hint" id="idHint"><p>That little wiggly bit at the end of the youtube url:</p><p>https://www.youtube.com/watch?v=<em>xp0NOjZlNlo</em></p></div><input type="text" id="youUrl" placeholder="song id"><input type="button" value="ADD SONG" onclick="submitSong()" class="button addButton"><input type="button" value="CANCEL" onClick="closeSong()" class="button cancelButton"></form>');
		$('#songPop').hide();
	}
});
socket.on('checkSong', function (data) {
	if (data.result == 'nExist') {
		console.log('song does not exist');
	}
	else if (data.result == 'nFound') {
		$('#songPop').html('<form data-surl="' + data.url + '"id="songForm"><p>Enter Artist and Song Name:</p><input id="songNameInput" type="text" placeholder="song name"><input id="artistNameInput" type="text" placeholder="artist name"><input type="button" value="ADD SONG" onclick="submitSongInfo()" class="button addButton"><input type="button" value="CANCEL" class="button cancelButton"></form>');
	}
});
socket.on('updateListeners', function (data) {
  $('#listenerCount').text(data.currentListeners + ' listeners');
});
socket.on('removeUser', function (data) {
  $('#' + data.ident).remove();
});
socket.on('addUser', function (data) {
  $("#lowerRoom").append('<div data-uname="' + data.username + '" class="backAvatar avatar" id="' + data.ident + '" style="background-image:url(../../img/' + data.avatar + 'Back.png);margin-top:' + data.y + 'px;margin-left:' + data.x + 'px;"></div>');
});
socket.on('addDJ', function (data) {
  $("#dj" + data.num).css('background-image', 'url("../img/laptop.png"), url("../img/' + data.avatar + 'Front.png")');
  $("#dj" + data.num).removeClass('addDj');
  $("#dj" + data.num).addClass('djPlaying');
  $("#dj" + data.num).addClass('avatar');
  $("#dj" + data.num).attr('data-uname', data.username);
  $('#' + data.ident).remove();
  if($('#stopDj').is(":hidden")) {
  	$("#dj" + (parseInt(data.num) + 1)).addClass('addDj');
  }
});
socket.on('roomChat', function (data) {
  $("#chatMessages").append('<li><b>' + data.info.username + '</b>: ' + data.info.message + '</li>');
  $("#chatMessages").animate({ scrollTop: $(document).height() }, "slow");
  return false;
});
socket.on('changeSong', function (data) {
  $('#songPlayer').html('<iframe width="0" height="0" src="https://www.youtube.com/embed/' + data.url + '?rel=0&amp;autoplay=1&amp;vq=small" frameborder="0" allowfullscreen></iframe>')
});

$('.sideIconLink').click(function(){
	$('.focus').removeClass('focus');
	$(this).addClass('focus');
	$('.sideSection').hide();
	$($(this).data('section')).show();
});

$('#hintHelper').hover(function() {
	$('#idHint').show();
}, function() {
	$('#idHint').hide();
});

$('#addSongLink').click(function() {
	$('#songPop').toggle();
	if($('#addSongIcon').hasClass('fi-plus')) {
		$('#addSongIcon').toggleClass('fi-plus fi-x');
	}
	else {
		$('#addSongIcon').toggleClass('fi-x fi-plus');
	}
});

function switchJoin() {
  $('#logForm').html('<input type="text" id="username" placeholder="username" required><input type="email" id="email" placeholder="email" required><input type="password" id="password1" placeholder="password" required><input type="password" id="password2" placeholder="confirm password" required><input type="button" onclick="register()" value="JOIN" class="button log left" id="joinButton"><input type="button" value="CANCEL" onclick="redirectHome()" class="button log right" id="logButton"><h4 id="error"></h4>');
  $('#signHead').html('SIGN UP');
  $('#mainBigBox').height($('#mainSmallBox').height() + 1);
};

function redirectHome() {
	location.href = "/";
}

function closeSong() {
	$('#songPop').toggle();
	$('#addSongIcon').toggleClass('fi-x fi-plus');
}

function login() {
	$.post("/",{query: 'loginAuth', user: $("#username").val(), pass: $("#password").val()})
	    .done(function(data) {
	    	if(data == "1") {
    			$("#error").text("success!");
    			setTimeout(function() {location.reload()}, 1000);
        	}
	        else {
	        	$("#error").text("incorrect login info");
	        }
	    });
	$('#mainBigBox').height($('#mainSmallBox').height() + 1);
}

function register() {
	if($("#password1").val() == $("#password2").val()) {
		if($("#password1").val().length > 5 && $("#password1").val().length < 31) {
			if($("#username").val().length < 31 && $("#username").val().length > 1) {
				$.post("/",{query: 'checkusername', user: $("#username").val()})
				    .done(function(data) {
				    	if(data == "1") {
				    		$.post("/",{query: 'checkemail', email: $("#email").val()})
							    .done(function(data2) {
							    	if(data2 == "1") {
							    		$.post("/",{query: 'registerUser', user: $("#username").val(), pass: $("#password1").val(), email: $("#email").val()});
							    		$("#error").text("success!");
							    		setTimeout(function() {location.reload()}, 1000);
							        }
							        else {
							        	$("#error").text("email in use");
							        }
							    });
				        }
				        else {
				        	$("#error").text("username taken");
				        }
				    });
			}
			else {
    			$("#error").text("usernames must be between 2 and 30 characters long");
    		}
		}
		else {
    		$("#error").text("passwords must be between 6 and 30 characters long");
    	}
	}
    else {
    	$("#error").text("passwords do not match");
    }
  $('#mainBigBox').height($('#mainSmallBox').height() + 1);
};

function submitRoom() {
	if($("#roomDJNumber").val() != null) {
		if($("#roomGenre").val() != null) {
			if($("#roomName").val().length > 5 && $("#roomName").val().length < 51) {
				if($("#roomId").val().length < 31 && $("#roomId").val().length > 1 && isValid($("#roomId").val()) && !hasWhiteSpace($("#roomId").val())) {
					$.post("/create",{query: 'checkroomname', room: $("#roomName").val()})
					    .done(function(data) {
					    	if(data == "1") {
					    		$.post("/create",{query: 'checkroomid', id: $("#roomId").val()})
								    .done(function(data2) {
								    	if(data2 == "1") {
								    		$.post("/create",{query: 'registerroom', room: $("#roomName").val(), roomid: $("#roomId").val(), genre: $("#roomGenre").val(), djs: $("#roomDJNumber").val()});
								    		$("#error").text("success!");
								    		window.location.href = "/lobby";
								        }
								        else {
								        	$("#error").text("email in use");
								        }
								    });
					        }
					        else {
					        	$("#error").text("username taken");
					        }
					    });
				}
				else {
	    			$("#error").text("usernames must be between 2 and 30 characters long and contain no special characters or spaces");
	    		}
			}
			else {
	    	$("#error").text("room names must be between 6 and 50 characters long");
	    }
	  }
		else {
			$("#error").text("please choose a genre");
		}
	}
	else {
		$("#error").text("please choose a DJ Number");
	}
};


//CODE EXPERIMENTS

//MAKE BACKGROUND SCROLL

/*
$(document).ready(function() {


    intval = window.setInterval(moveBg, 5);
});

function moveBg() {
    
    pos++;
    
    $(".djRoom").css({backgroundPosition: (pos * .3) + "px " + (pos * -.6) + "px"});
}
*/

//POOR SYNTAX RENDERING, VALIDATION CODE FOR WHITESPACE/SPECIAL CHARACTERS

function hasWhiteSpace(str) {
  return str.indexOf(' ') >= 0;
}
function isValid(str){
 return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
};