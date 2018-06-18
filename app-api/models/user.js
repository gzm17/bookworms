var bcrypt = require("bcrypt-nodejs");
var mongoose = require("mongoose");

var SALT_FACTOR = 10; //number of times bcrypt hashes the password for security 

//This defines the user schema for mongoose
var userSchema = mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    displayName: String,
    bio: String,
});

var noop = function () {}; //this function does nothing - dont know why it is needed

//before saving user info to mongoose, does some setup, mostly pwd hashes

userSchema.pre("save", function(done) {
    
    var user = this; //pass ref to user
    
    if (!user.isModified("password")) { //skip if pwd is NOT modified
        return done();
    }
    
    //if pwd is modified, hash pwd SALT_FACTOR times and save the result to user.password
    bcrypt.genSalt(SALT_FACTOR, function(err, salt){
        if (err) {return done(err);}
        bcrypt.hash(user.password, salt, noop, function (err, hashedPassword) {
            if (err) {return done(err);}
            user.password = hashedPassword;
            done();
        });
        
    });

});

//adding a method to userSchema to check user pwd
userSchema.methods.checkPassword = function(guess, done){
    bcrypt.compare(guess, this.password, function(err, isMatch){
        done(err, isMatch);
    });
};

//adding a method to get user name to the schema
userSchema.methods.name = function (){
    return this.displayName || this.username;
};

var User = mongoose.model("User", userSchema);

module.exports = User;



