var express = require("express");
var User = require("../../app-api/models/user");
var Book = require("../../app-api/models/book");
var MyBooks = require("../../app-api/models/mybooks");
var MyBorrowedBooks = require("../../app-api/models/myborrowedbooks");
var MyLentBooks = require("../../app-api/models/mylentbooks");
var MyRequestedBooks = require("../../app-api/models/myrequests");
var passport = require("passport");
var ctrlData = require("../../app-api/controllers/api-data.js");
var ctrlView = require("../controllers/view-ctrl.js");

var router = express.Router(); 

router.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});

// display pages in the selected category
router.get("/", ctrlView.goHome); // first page or home page
//router.get("/mybooks", ctrlView.showMyBooks); //show dashboard after log in
router.get("/getbooks", ctrlView.getBooks); //show get  books after log in
router.post("/searchbooks", ctrlView.searchBooks); //search books using entered titles from getBooks
router.post("/getbooks/selectedbooks", ctrlView.handleSelectedBooks); //
router.get("/mybooks", ctrlView.viewMyBooks); // get mybooks, myborrowedbooks, my lentbooks, myrequestedbooks
router.get("/requestbooks", ctrlView.requestBooks);
router.post("/requestbooks/sendrequests", ctrlView.sendRequests);
router.get("/borrowbooks", ctrlView.borrowBooks); // tested
router.post("/borrowbooks/confirmation", ctrlView.borrowConfirmation); //untested
router.get("/lendbooks", ctrlView.lendBooks); // untested - post bj trip
router.post("/lendbooks/confirmation", ctrlView.lendConfirmation); //untested - post bj trip
router.get("/returnbook/search?*", ctrlView.returnBook); //

router.post("/api/returnbook", ctrlData.returnBook); //
router.get("/api/lendbooks/:username", ctrlData.lendBooks); // untested - post bj trip
router.post("/api/lendconfirmation", ctrlData.lendConfirmation); // tested - post bj trip
router.get("/api/borrowbooks/:username", ctrlData.borrowBooks); // untested - 
router.post("/api/borrowconfirmation", ctrlData.borrowConfirmation); // untested - 
router.get("/api/requestbooks/:username", ctrlData.requestBooks);
router.post("/api/sendrequests", ctrlData.sendRequests);
router.get("/api/searchbooks/*", ctrlData.searchBooks); // submit google search to routine in api module
router.post("/api/selectedbooks", ctrlData.handleSelectedBooks); // save selected books to user account
router.get("/api/getmybooks/:username", ctrlData.getMyBooks); // get mybooks for given user account
router.get("/api/myborrowedbooks/:username", ctrlData.getMyBorrowedBooks);
router.get("/api/mylentbooks/:username", ctrlData.getMyLentBooks);
router.get("/api/myrequestedbooks/:username", ctrlData.getMyRequestedBooks);


router.get("/users/:username", function(req, res, next){
    console.log("ZG: username is:", req.params.username);
    User.findOne({username: req.params.username}, function(err, user){
        if(err) {return next(err);}
        if(!user) {return next(404);}
        console.log("router.username: before render: username = ", user.username, " currentUser = ", res.locals.currentUser);
        res.render("profile", {user: user});
        console.log("router.username: after render: username = ", user.username, " currentUser = ", res.locals.currentUser);
    });
});


router.get("/signup", function(req, res){
    res.render("../views/signup");
});

router.post("/signup", function(req, res, next){
    var username = req.body.username; //body-parser adds the username and pwd to req.body
    var password = req.body.password;
    var email = req.body.email;
    
    User.findOne({username: username}, function(err, user){ //calls findOne to return just one user on username
        if (err) return next(err);
        if (user) {
            req.flash("error", "User already exists");
            return res.redirect("/signup");
        }
        
        var newUser = new User({
            username: username,
            email: email,
            password: password
        });
        
        // Create doc of mybooks with books field empty as a work around of a problem when saving mybooks initially from handleSelected Books, it creates multiple records with userID and books, instead of appending all books into array. Doing the same thing for other documents
        newUser.save().then(function(x){
            
            var newMyBooks = new MyBooks({
                username: x.username,
                books: []
            });
            newMyBooks.save(); //save the new user to db and continues to the next handler  
            
            var newBorrowedBooks = new MyBorrowedBooks({
                username: x.username,
                books: []
            });
            newBorrowedBooks.save(); //save the new user to db and continues to the next handler              
            
             var newLentBooks = new MyLentBooks({
                username: x.username,
                books: []
            });
            newLentBooks.save(); //save the new user to db and continues to the next handler                  
            
            var newMyRequests = new MyRequestedBooks({
                username: x.username,
                books: []
            });
            newMyRequests.save(next); //save the new user to db and continues to the next handler                           
            
        }); //save the new user to db and continues to the next handler

    });
}, passport.authenticate("login", { //authenticate the user
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true
}));

router.get("/login", function(req, res){
    res.render("../views/login");
})

router.post("/login", passport.authenticate("login", {
    successRedirect: "/mybooks",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});


router.get("/edit", ensureAuthenticated, function(req, res){
    //console.log("ZG inside edit -> displayName = ");
    res.render("../views/edit");
});

router.post("/edit", ensureAuthenticated, function(req, res, next){
    req.user.displayName = req.body.displayname;
    req.user.bio = req.body.bio;
    req.user.email = req.body.email;
    req.user.save(function(err){
        if(err) {
            next(err);
            return;
        }
        req.flash("info", "Profile updated!");
        res.redirect("/edit");
    });
});

function ensureAuthenticated(req, res, next) {
    console.log("ZG enter ensureAuthenticated");
    if(req.isAuthenticated()) { //a function provided by passport
        console.log("ZG: inside ensureAuthenticated - ", req.isAuthenticated());
        next();
    } else {
        req.flash("info", "You must be logged in to see this page.");
        res.redirect("/login");
    }
}

module.exports = router;

