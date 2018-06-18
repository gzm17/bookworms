var express = require("express");
var mongoose = require("mongoose");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var flash = require("connect-flash");
var passport = require("passport");
var setUpPassport = require("./setuppassport");

var routes = require("./app-server/routes/routes"); //direct file to routes dir

var app = express();
var url = process.env.MONGOLAB_URI;
console.log("URL: ", url);

//mongoose.connect("mongodb://localhost:27017/bookworms"); //use the test db in localhost
//mongoose.connect(url, {auth:{authdb:"admin"}}); //use the mLab free tier db 
/* the above does not work with errors
/Users/Z/coding/barhop/node_modules/mongodb-core/lib/auth/scram.js:130
    username = username.replace('=', '=3D').replace(',', '=2C');
                        ^

TypeError: Cannot read property 'replace' of undefined
    at executeScram (/Users/Z/coding/barhop/node_modules/mongodb-core/lib/auth/scram.js:130:25)
    at /Users/Z/coding/barhop/node_modules/mongodb-core/lib/auth/scram.js:299:7
    at process._tickCallback (internal/process/next_tick.js:150:11)
*/

mongoose.connect(url, {useMongoClient: true}); //use the mLab free tier db, this works
 
/*
WARNING: The `useMongoClient` option is no longer necessary in mongoose 5.x, please remove it.
    at handleUseMongoClient (/Users/Z/coding/letsvote/node_modules/mongoose/lib/connection.js:440:17)
    at NativeConnection.Connection.openUri (/Users/Z/coding/letsvote/node_modules/mongoose/lib/connection.js:327:7)
*/
/*
But without using useMongoClient: true, it does not work. March 30 2017
*/

setUpPassport();

app.set("port", process.env.PORT || 3000); 
app.set("views", path.join(__dirname, 'app-server', 'views'));
app.set("view engine", "ejs");

//the following sets up to use four middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: "thisissupposedtobeasecretkey-doesittakeanyinput??",
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(routes);

app.listen(app.get("port"), function() {
    console.log("Server started on port " + app.get("port"));
});


