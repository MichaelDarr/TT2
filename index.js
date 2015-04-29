var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var bodyParser = require("body-parser");
var mysql = require('mysql');
var http = require('http');
var hbs = require('hbs');
var passwordHash = require('password-hash');
var request = require('request');
var redis = require('redis');
var rClient = redis.createClient();
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'turntable',
  password : 'U2greenday',
  database : 'tt2'
});
connection.connect();

hbs.localsAsTemplateData(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

app.use("/stylesheets",express.static(__dirname + "/stylesheets"));
app.use("/foundation-icons",express.static(__dirname + "/foundation-icons"));
app.use("/js",express.static(__dirname + "/js"));
app.use("/img",express.static(__dirname + "/img"));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
	store: new RedisStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

http.listen(80, function(){
  console.log('listening on *:80');
});

io.sockets.on('connection', function(socket) {
	socket.on('removeDj', function(info) {
		console.log('dj removed');
		var djNum;
		connection.query('SELECT status FROM users WHERE id="' + info.ident + '";', function(err, results, fields) {
			if (err) throw err;
			djNum = results[0].status;
			connection.query('UPDATE users SET status="listening", x="' + info.x + '", y="' + info.y + '" WHERE id="' + info.ident + '";', function(err, results, fields) {
				if (err) throw err;
				info.djNumber = djNum;
				io.to(info.room).emit('addUser', info);
				io.to(info.room).emit('removeDj', info);
			});
		});
  });
  socket.on('unloadDj', function(info) {
		console.log('dj unloaded');
		var djNum;
		connection.query('SELECT status FROM users WHERE id="' + info.ident + '";', function(err, results, fields) {
			if (err) throw err;
			djNum = results[0].status;
			connection.query('UPDATE users SET status="offline", x="' + info.x + '", y="' + info.y + '" WHERE id="' + info.ident + '";', function(err, results, fields) {
				if (err) throw err;
				info.djNumber = djNum;
				io.to(info.room).emit('removeDj', info);
			});
		});
  });
	socket.on('submitSong', function(info) {
		var newSongId;
		var songListString;
		connection.query('INSERT INTO songs (name, artist, url) VALUES ("' + info.name + '","' + info.artist + '","' + info.song + '");', function(err, results, fields) {
			if (err) throw err;
			newSongId = results.insertId;
		});
		connection.query('SELECT songList FROM users WHERE id="' + info.ident + '";', function(err, results, fields) {
			if (err) throw err;
			if (results[0].songList) {
				songListString = results[0].songList + ',' + newSongId.toString();
			}
			else {
				songListString = newSongId.toString();
			}
			connection.query('UPDATE users SET songList="' + songListString + '" WHERE id="' + info.ident + '";');
			socket.emit('songEmitComplete', {result: 'success'});
		});
	})
	socket.on('checkSong', function(info) {
  	connection.query('SELECT * FROM songs WHERE url="' + info.song + '";', function(err, results, fields) {
  		if (results.length > 0) {
  			connection.query('SELECT songList FROM users WHERE id="' + info.ident + '"', function(err, results, fields) {
  			});
  		}
  		else {
  			request.get('https://www.youtube.com/watch?v=' + info.song, function(error, response, body){
	        if(response.statusCode === 404){
	          socket.emit('checkSong', {result: 'nExist'});
	        }
	        else{
	          socket.emit('checkSong', {result: 'nFound', url: info.song});
	        }
	    	});
  		}
  	});
  });
  socket.on('userJoined', function(info) {
  	socket.join(info.room);
  	socket.broadcast.to(info.room).emit('addUser', info);
  	var currentListeners;
  	if(io.of('/').adapter.rooms[info.room]) {
  		currentListeners = Object.keys(io.of('/').adapter.rooms[info.room]).length;
  	}
  	else {
  		currentListeners = 1;
  	}
  	connection.query('UPDATE rooms SET listeners="' + currentListeners + '" WHERE id="' + info.room + '";', function(err, results, fields) {
		  if (err) throw err;
		});
  	socket.to(info.room).emit('updateListeners', {currentListeners: currentListeners});
  });
  socket.on('addDJ', function(info) {
  	connection.query('UPDATE users SET x="null", y="null", status="' + info.num + '" WHERE id="' + info.ident + '";', function(err, results, fields) {
		  if (err) throw err;
		});
		if(info.num == 0) {
			rClient.hmset('songinfo', 'song', info.song, 'artist', info.artist, 'url', info.url, 'songId', info.songId, 'djNum', info.num, 'djId', info.ident)
			io.to(info.room).emit('changeSong', {song: info.song, artist: info.artist, url: info.url, songId: info.songId} );
		}
  	socket.broadcast.to(info.room).emit('addDJ', info);
  });
  socket.on('userLeft', function(info) {
  	socket.leave(info.room);
  	var currentListeners;
  	if(io.of('/').adapter.rooms[info.room]) {
  		currentListeners = Object.keys(io.of('/').adapter.rooms[info.room]).length;
  	}
  	else {
  		currentListeners = 1;
  	}
  	socket.broadcast.to(info.room).emit('removeUser', info);
  	connection.query('UPDATE rooms SET listeners ="' + currentListeners + '" WHERE id="' + info.room + '";', function(err, results, fields) {
		  if (err) throw err;
		});
		connection.query('UPDATE users SET x="null", y="null", status="offline", room="null" WHERE id="' + info.ident + '";', function(err, results, fields) {
		  if (err) throw err;
		});
		socket.to(info.room).emit('updateListeners', {currentListeners: currentListeners});
  });
  socket.on('roomChat', function(info) {
		io.to(info.room).emit('roomChat', {info: info});
  });
});

app.get('/rooms/:name', function(req , res){
	var sess = req.session;
	if(sess.username) {
		var beginningSong;
		var currentSong;
		var djExist = false;
		var roomInfo = [];
	  var name = req.params.name;
	  var listenersInfo = [];
	  var djsInfo = [];
	  var x = Math.floor(Math.random()*581);
	  var y = Math.floor(Math.random()*235);
	  connection.query('SELECT * FROM rooms WHERE id="' + name + '";', function(err, results, fields) {
	  	roomInfo[0] = results[0].room.substring(1, results[0].room.length-1);
	  	roomInfo[1] = results[0].djs;
	  	roomInfo[2] = parseInt(results[0].listeners) + 1;
	  	roomInfo[3] = name;
	  });
	  connection.query('UPDATE users SET room="' + name + '", x="' + x + '", y="' + y + '", status="listening" WHERE username = "' + mysql.escape(sess.username) + '";', function(err, results, fields) {});
	  var myInfo = [sess.username,x,y,'av',sess.ident];
	  connection.query('SELECT * FROM users WHERE room="' + name + '" and username != "' + mysql.escape(sess.username) + '";', function(err,results,fields) {
	  	if (err) throw err;
			var lisCount = 0;
			var djCount = 0;
			for (var i in results) {
				if(results[i].status == 'listening') {
					listenersInfo[lisCount] = [];
					listenersInfo[lisCount][0] = results[i].username.substring(1, results[i].username.length-1);
					listenersInfo[lisCount][1] = results[i].x;
					listenersInfo[lisCount][2] = results[i].y;
					listenersInfo[lisCount][3] = 'av';
					listenersInfo[lisCount][4] = results[i].id;
					lisCount++;
				}
				else {
					djExist = true;
					djsInfo[djCount] = [];
					djsInfo[djCount][0] = results[i].username.substring(1, results[i].username.length-1);
					djsInfo[djCount][1] = 'av';
					djsInfo[djCount][2] = results[i].id;
					djsInfo[djCount][3] = results[i].status;
					djsInfo[djCount][4] = results[i].songList;
					djCount++;
				}
			}
			if(djExist) {
				rClient.hgetall('songinfo', function (err, obj) {
					currentSong = obj;
				});
			}
			else {
				currentSong = false;
			}
			connection.query('SELECT songList FROM users WHERE id="' + sess.ident + '";', function(err, results, fields) {
				if(results[0].songList) {
					var songInfoArray = [];
					var songArray = results[0].songList.split(',');
					songArray = songArray.map(function(e) { return parseInt(e) });
					for (var i = 0; i < songArray.length; i++) {
						(function() {
							var iN = i;
							connection.query('SELECT * FROM songs WHERE id="' + songArray[iN] + '";', function(err1, results1, fields1) {
								songInfoArray[iN] = [];
								songInfoArray[iN][0] = songArray[iN];
								songInfoArray[iN][1] = results1[0].name;
								songInfoArray[iN][2] = results1[0].artist;
								songInfoArray[iN][3] = results1[0].url;
								if(iN == (songArray.length - 1)) {
									res.render('room.hbs', {info: roomInfo, myInfo: myInfo, listenerInfo: listenersInfo, djInfo: djsInfo, songs: songInfoArray, currentSong: currentSong});
								}
							});
						}());
					}
				}
				else {
					var songInfoArray = [];
					res.render('room.hbs', {info: roomInfo, myInfo: myInfo, listenerInfo: listenersInfo, djInfo: djsInfo, songs: songInfoArray, currentSong: currentSong});
				}
			});
	  });
	}
	else {
		res.redirect('/');
	}
});

app.get('/',function(req,res){
	var sess = req.session;
	if(sess.username) {
		res.redirect('/lobby');
	}
	else {
		res.render('login.hbs');
	}
});

app.get('/logOut',function(req,res){
  req.session.destroy(function(err) {});
  res.redirect('/');
});

app.get('/lobby',function(req,res){
	var sess = req.session;
	if(!sess.username) {
		res.redirect('/');
	}
	else {
		var roomInfo = [];
		connection.query('SELECT * FROM rooms ORDER BY listeners DESC LIMIT 10', function(err, results, fields) {
			if (err) throw err;
			else {
				for (var i in results) {
					roomInfo[i] = [];
					roomInfo[i][0] = results[i].room.substring(1, results[i].room.length-1);
					roomInfo[i][1] = results[i].djs + " dj spots available";
					roomInfo[i][2] = results[i].listeners;
					roomInfo[i][3] = results[i].song;
					roomInfo[i][4] = results[i].id;
					if(!roomInfo[i][3]) {
						roomInfo[i][3] = 'no current song';
					}
					i++;
				}
			}
			
			res.render('lobby.hbs', {info: roomInfo, username: sess.username});
		});
	}
});

app.get('/create',function(req,res){
	var sess = req.session;
	if(!sess.username) {
		res.redirect('/');
	}
	else {
		app.locals.username = sess.username;
		res.render('createRoom.hbs');
	}
});

app.post('/create',function(req,res){
	if(req.body.query == 'checkroomname') {
	  var room=req.body.room;
		connection.query('SELECT * FROM rooms WHERE room = "' + mysql.escape(room) + '"', function(err, results, fields) {
		  if (err) throw err;
		  else {
		  	if (results.length > 0) {
		  		res.end("0");
		  	}
		  	else {
		  		res.end("1");
		  	}
		  }
		});
	}
	else if (req.body.query == 'checkroomid') {
		var id = req.body.id;
		connection.query('SELECT * FROM rooms WHERE id = "' + id + '"', function(err, results, fields) {
		  if (err) throw err;
		  else {
		  	if (results.length > 0) {
		  		res.end("0");
		  	}
		  	else {
		  		res.end("1");
		  	}
		  }
		});
	}
	else if (req.body.query == 'registerroom') {
		var room = req.body.room;
	  var roomid = req.body.roomid;
	  var genre = req.body.genre;
	  var djs = req.body.djs;
		connection.query('INSERT INTO rooms (room, id, genre, djs, listeners) VALUES ("' + mysql.escape(room) + '","' + roomid + '","' + genre + '","' + djs + '", 0);', function(err, results, fields) {
		  if (err) throw err;
		});
	}
});

app.post('/',function(req,res){
	var sess = req.session;
	if(req.body.query == 'loginAuth') {
	  var user = req.body.user;
	  var pass = req.body.pass;
		connection.query('SELECT * FROM users WHERE username = "' + mysql.escape(user) + '";', function(err, rows, fields) {
		  if (err) throw err;
		  if (rows.length > 0 && passwordHash.verify(pass, rows[0].password)) {
		  	sess.username = user;
		  	sess.ident = rows[0].id;
		  	res.end("1");
		  }
		  else {
		  	res.end("0");
		  }
		});
	}
	else if (req.body.query == 'checkusername') {
		var username=req.body.user;
		connection.query('SELECT * FROM users WHERE username = "' + mysql.escape(username) + '"', function(err, results, fields) {
		  if (err) throw err;
		  else {
		  	if (results.length > 0) {
		  		res.end("0");
		  	}
		  	else {
		  		res.end("1");
		  	}
		  }
		});
	}
	else if (req.body.query == 'checkemail') {
		var email = req.body.email;
		connection.query('SELECT * FROM users WHERE email = "' + mysql.escape(email) + '"', function(err, results, fields) {
		  if (err) throw err;
		  else {
		  	if (results.length > 0) {
		  		res.end("0");
		  	}
		  	else {
		  		res.end("1");
		  	}
		  }
		});
	}
	else if (req.body.query == 'registerUser') {
		var user = req.body.user;
	  var pass = passwordHash.generate(req.body.pass);
	  var email = req.body.email;
		connection.query('INSERT INTO users (username, password, email) VALUES ("' + mysql.escape(user) + '","' + pass + '","' + mysql.escape(email) + '");', function(err, results, fields) {
		  if (err) throw err;
		});
	}
});