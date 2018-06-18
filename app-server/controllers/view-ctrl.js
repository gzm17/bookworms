var request = require("request");
var apiOptions = {
    server: "https://fccbookworms.herokuapp.com" // when run in heroku
    //server: "http://localhost:3000" //when run in local host
};
if (process.env.NODE_ENV === "production")
    apiOptions.server = "https://fccbookworms.herokuapp.com";

var renderViews = function (req, res, path, data) {
    //console.log("Enter view-ctrl render:", body);
    res.render(path, data);
}

//show home page
module.exports.goHome = function(req, res) { 
    var user = res.locals.currentUser;
    res.render("../views/index");
}

// show get books page
module.exports.getBooks = function(req, res) { 
    var user = res.locals.currentUser;
    renderViews(req, res, "../views/getbooks", {books: []});
}

//Get post parameters before submitting to google api
module.exports.searchBooks = function(req, res) { 
    var user = res.locals.currentUser;
    var title = (typeof req.body.title != "undefined" ? req.body.title : req.params.title);
    
    console.log("ctrl-view, title = ", title);
    
    //get google search result
    var requestOptions, path = "/api/searchbooks/search?title=" + title;
    requestOptions = {
        url: apiOptions.server + path,
        method: 'GET',
        json: {}
    };
    
    request(requestOptions, function(err, response, books){
        if (err) console.log("err in view-ctrl api req: ", err);
        //console.log("ctrl-view, google api result ok? books", books);
        // do something with books
        renderViews(req, res, "../views/getbooks", {books: books});
    });
}

module.exports.handleSelectedBooks = function(req, res) {
    var books = req.body['uploaded'];
    console.log("ctrl-view handleSelectedBooks: current user = ", res.locals.currentUser);
    
    //post google search result to db api
    var requestOptions, path = "/api/selectedbooks";
    requestOptions = {
        url: apiOptions.server + path,
        method: 'POST',
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        form: {uploaded: books, username: res.locals.currentUser.username}
    };
    
    request(requestOptions, function(err, response, body){
        if (err) console.log("err in view-ctrl psoting selected books: ", err);
        console.log("ctrl-view, posting selected books?", body);
        //response.end();
    });     
}

// get myborrowedbooks
var getMyBorrowedBooks = function(username){
    return new Promise((resolve, reject) => {
        //get myborrowedbooks data
        var requestOptions, path = "/api/myborrowedbooks/"+username;
        requestOptions = {
            url: apiOptions.server + path,
            method: 'GET',
            json: true
        }; 
        request(requestOptions, function(err, response, data){
            if (err) reject("err in view-ctrl get mybooks: ", err);
            resolve(data);
        });    
    });      
}

// get mybooks
var getMyBooks = function(username){
    return new Promise((resolve, reject) => {
        //get mybooks data
        var requestOptions, path = "/api/getmybooks/"+username;
        requestOptions = {
            url: apiOptions.server + path,
            method: 'GET',
            json: true
        }; 
        request(requestOptions, function(err, response, data){
            if (err) reject("err in view-ctrl get mybooks: ", err);
            resolve(data);
        }); 
    });         
}
    

// get mylentbooks
var getMyLentBooks = function(username){
    return new Promise((resolve, reject) => {
        // get my lent books
        var requestOptions, path = "/api/mylentbooks/"+username;
        requestOptions = {
            url: apiOptions.server + path,
            method: 'GET',
            json: true
        }; 
        request(requestOptions, function(err, response, data){
            if (err) reject("err in view-ctrl get mylentbooks: ", err);
            resolve(data);
        });  
    });
}

// get myrequestedbooks
var getMyRequestedBooks = function(username){
    return new Promise((resolve, reject) => {
        //get myrequestedbooks data
        var requestOptions, path = "/api/myrequestedbooks/"+username;
        requestOptions = {
            url: apiOptions.server + path,
            method: 'GET',
            json: true
        }; 
        request(requestOptions, function(err, response, data){
            if (err) reject("err in view-ctrl get mylentbooks: ", err);
            resolve(data);
        });           
    });      
}

// get available books list from API
var getAvailableBooks = function(username){
    return new Promise((resolve, reject) => {
    
        //get mybooks data
        var requestOptions, path = "/api/requestbooks/"+username;
        console.log("ctrlView - username = ", username);
        requestOptions = {
            url: apiOptions.server + path,
            method: 'GET',
            json: true
        };
        request(requestOptions, function(err, response, books){
            if (err) console.log("err in view-ctrl borrow books: ", err);
            console.log("ctrl-view/requestbooks", books);
            resolve(books);
        });
    });
}
                       

// view my books - get data and send render to mybooks page
module.exports.viewMyBooks = function(req, res){
    var username = res.locals.currentUser.username;
    var mybooks = [], myborrowedbooks = [], mylentbooks = [], myrequestedbooks = [];
    
    void async function(){
        mybooks = await getMyBooks(username);
        //console.log("ctrlView - getMyBooks: ", mybooks.length, mybooks[0]);
        myborrowedbooks = await getMyBorrowedBooks(username);
        //console.log("ctrlView - getMyBorrowedBooks: ");
        mylentbooks = await getMyLentBooks(username);
        //console.log("ctrlView - getMyLentBooks: ");
        myrequestedbooks = await getMyRequestedBooks(username);
        //console.log("ctrlView - getMyRequestedBooks: ");
        //console.log("ctrlView - getmybooks: all done - to send");
        
        renderViews(req, res, "../views/mybooks", {mybooks: mybooks, myborrowedbooks: myborrowedbooks, mylentbooks: mylentbooks, myrequestedbooks: myrequestedbooks});
    }();
}

// borrow books - get list of available books for borrowing and send data to pg to render
module.exports.requestBooks = function(req, res){
    var username = res.locals.currentUser.username;
    var availablebooks = [], myrequestedbooks = [];
    
    void async function(){
        availablebooks = await getAvailableBooks(username);
        myrequestedbooks = await getMyRequestedBooks(username);
        console.log("ctrlView - getMyRequestedBooks: ", availablebooks, myrequestedbooks);
        
        renderViews(req, res, "../views/requestbooks", {books: availablebooks, myrequestedbooks: myrequestedbooks});
    }(); 
    /*
    //get mybooks data
    var requestOptions, path = "/api/requestbooks/"+username;
    console.log("ctrlView - username = ", username);
    requestOptions = {
        url: apiOptions.server + path,
        method: 'GET',
        json: true
    };
    
    request(requestOptions, function(err, response, books){
        if (err) console.log("err in view-ctrl borrow books: ", err);
        console.log("ctrl-view/requestbooks", books);
        renderViews(req, res, "../views/requestbooks", {books: books});
    }); 
    */
}

module.exports.sendRequests = function(req, res) {
    var requests = req.body['uploaded'];
    console.log("ctrl-view sendRequests: current user = ", res.locals.currentUser.username, requests);
    
    //post google search result to db api
    var requestOptions, path = "/api/sendrequests";
    requestOptions = {
        url: apiOptions.server + path,
        method: 'POST',
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        form: {uploaded: requests, username: res.locals.currentUser.username}
    };
    
    request(requestOptions, function(err, response, body){
        if (err) console.log("err in view-ctrl psoting reuested books: ", err);
        console.log("ctrl-view, posting requested books?", body);
        return res.redirect("/requestbooks"); //response.end();
    });     
}

// borrow books - get list of my requested books and send data to pg to render
module.exports.borrowBooks = function(req, res){
    var username = res.locals.currentUser.username;
    
    //get my requested books data
    var requestOptions, path = "/api/borrowbooks/"+username;
    console.log("ctrlView - username = ", username);
    requestOptions = {
        url: apiOptions.server + path,
        method: 'GET',
        json: true
    };
    
    request(requestOptions, function(err, response, books){
        if (err) console.log("err in view-ctrl borrow books: ", err);
        console.log("ctrl-view/borrowbooks", books);
        renderViews(req, res, "../views/borrowbooks", {books: books});
    });  
}

module.exports.borrowConfirmation = function(req, res) {
    var confirmed = req.body['uploaded'];
    console.log("ctrl-view borrowConfirmation: current user = ", res.locals.currentUser.username, confirmed);
    
    //post google search result to db api
    var requestOptions, path = "/api/borrowconfirmation";
    requestOptions = {
        url: apiOptions.server + path,
        method: 'POST',
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        form: {uploaded: confirmed, username: res.locals.currentUser.username}
    };
    
    request(requestOptions, function(err, response, body){
        if (err) console.log("err in view-ctrl psoting borrow confirmation: ", err);
        console.log("ctrl-view, posting borrow confirmed books?", body);
        return res.end(); //response.end();
    });     
}

// Lend books - get list of requested books that I also own and send data to pg to render
module.exports.lendBooks = function(req, res){
    var username = res.locals.currentUser.username;
    
    //get requested books which I own data
    var requestOptions, path = "/api/lendbooks/"+username;
    console.log("ctrlView - username = ", username);
    requestOptions = {
        url: apiOptions.server + path,
        method: 'GET',
        json: true
    };
    
    request(requestOptions, function(err, response, books){
        if (err) console.log("err in view-ctrl lend books: ", err);
        console.log("ctrl-view/lendbooks", books);
        renderViews(req, res, "../views/lendbooks", {books: books});
    });  
}

module.exports.lendConfirmation = function(req, res) {
    var confirmed = req.body['uploaded'];
    console.log("ctrl-view lendConfirmation: current user = ", res.locals.currentUser.username, confirmed);
    
    //post google search result to db api
    var requestOptions, path = "/api/lendconfirmation";
    requestOptions = {
        url: apiOptions.server + path,
        method: 'POST',
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        form: {uploaded: confirmed, username: res.locals.currentUser.username}
    };
    
    request(requestOptions, function(err, response, body){
        if (err) console.log("err in view-ctrl psoting confirmation: ", err);
        console.log("ctrl-view, posting confirmed books?", body);
        return res.end(); //response.end();
    });     
}

// return book from current user to lender (ownerOfBook)
module.exports.returnBook = function(req, res) {
    var bookID = req.query.bookID;
    var owner = req.query.owner;
    console.log("ctrl-view returnBook: current user= ", res.locals.currentUser.username, " bookID=", bookID, " owner=", owner);
    
    //post google search result to db api
    var requestOptions, path = "/api/returnbook";
    requestOptions = {
        url: apiOptions.server + path,
        method: 'POST',
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        form: {bookID: bookID, username: res.locals.currentUser.username, owner: owner}
    };
    
    request(requestOptions, function(err, response, body){
        if (err) console.log("err in view-ctrl returnbook: ", err);
        console.log("ctrl-view, returnbook", body);
        return res.redirect("/mybooks"); //response.end();
    });     
}


var getDisplayInfo = function (req, res, title) {
    
    //get bars info
    var requestOptions, path = "/api/shops/search?city=" + city;
    requestOptions = {
        url: apiOptions.server + path,
        method: 'GET',
        json: {}
    };
    
    request(requestOptions, function(err, response, bars){
        if (err) console.log("err in view-ctrl api req: ", err);
        //console.log("bars api ok: ", bars);
        //renderShopsView(req, res, body);
        
            //get barbito info
            var requestOptions1, path1 = "/api/shops/barbito";
            requestOptions1 = {
                url: apiOptions.server + path1,
                method: 'GET',
                json: {}
            };

            request(requestOptions1, function(err, response, barbito){
                if (err) console.log("err in view-ctrl api req: ", err);
                console.log("barbito api ok: ", barbito);
                renderShopsView(req, res, {bars: bars, barbito: barbito, city: city});
            });
    });   
}

//after post get data from yelp-fusion
module.exports.getData = function(req, res) { 
    var user = res.locals.currentUser;
    var city = (typeof req.body.city != "undefined" ? req.body.city : req.params.city);
    tmp += 1;
    
    if (typeof city != "undefined") global.cityInput = city;
    console.log("view getData round=", tmp, " global.city=", global.cityInput, " city=", city);
    getDisplayInfo(req, res, global.cityInput);
}

//get barbito data 
module.exports.getBarbito = function(req, res) { 
    var user = res.locals.currentUser;
    var city = (typeof req.body.city != "undefined" ? req.body.city : req.params.city);
    
    if (typeof city != "undefined") global.cityInput = city;
    
    console.log("view getBarbito round=", tmp, " global.city=", global.cityInput, " city=", city);
    getDisplayInfo(req, res, global.cityInput);

}

// update changes
module.exports.updateBarbito = function(req, res, next) {
    var barId = req.query.bar;
    var go = req.query.go;
    var city = req.query.city;
    var user = req.user.username;
    console.log("view updateBarbito: ", barId, go, city, user);
    
    //get bars info
    var requestOptions, path = "/api/shops/go/search?go=" + go + "&city=" + city + "&bar=" + barId + "&user=" + user;
    requestOptions = {
        url: apiOptions.server + path,
        method: 'POST',
        json: {}
    };
    
    request(requestOptions, function(err, response, barbito){
        if (err) console.log("err in view-ctrl api req: ", err);
        console.log("view api barbito ok? city barbito", city, barbito);
        res.redirect("/city/"+city);
    });
}
        
