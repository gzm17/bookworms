var passport = require("passport");
var User = require("./app-api/models/user");

var LocalStrategy = require("passport-local").Strategy;

module.exports = function(){
    passport.serializeUser(function(user, done){
        console.log("serialized");
        done(null, user._id); //serialization turns user into an id. Call done if there is no err
    });
    
    passport.deserializeUser(function(id, done){
        console.log("deserialized");
        User.findById(id, function(err, user){
            done(err, user);
        });
    });
 
    passport.use("login", new LocalStrategy(function(username, password, done){ //not clear if this block should stay inside the module.export loop??
        console.log("passport.use: entered localstra");
        User.findOne({username: username}, function(err, user){
            console.log("passport.use: entered User.fineOne");
            if (err) return done(err);
            if (!user) {
                return done(null, false, {message: "No user has that username!"});
         }
            user.checkPassword(password, function(err, isMatch){
                console.log("passport.use: entered user.checkPasswiord");
                if(err) return done(err);
                if(isMatch) return done(null, user);
                else return done(null, false, {message: "Invalid password."});
            });
        });
    }));

};

