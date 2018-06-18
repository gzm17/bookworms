var ObjectId = require('mongoose').Types.ObjectId; 
var request = require("request");
var User = require("../models/user");
var Book = require("../models/book");
var MyBooks = require("../models/mybooks");
var MyBorrowedBooks = require("../models/myborrowedbooks");
var MyLentBooks = require("../models/mylentbooks");
var MyRequestedBooks = require("../models/myrequests");
var fs = require('fs');

// https://console.developers.google.com/apis/credentials?project=dulcet-metric-193302 ZG's credentials
var apiKey = "AIzaSyAE4tJ_7vB5NlBrrlA2Q6apQOx--FnJt7A"; //apiKey gotten from google under bookworms
const clientID = "118887657733-unm8jutmqoij1drlavpnqpdmlvg3d0sj.apps.googleusercontent.com"; // google api 0auth client under bookworms
const clientSecret = "jSBBpg4qa-YGup4x_ieBi5me"; // google api 0auth client underr bookworms
//Oauth client is not used at this point. apikey seems simpler to use

var username, firstTime = true;

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

var saveMyBook = function(bookID){
    MyBooks.findOne({username: username}, function(err, result){ //update myBooks
        console.log("ZZZ username bookID", username, bookID);
        if(result) {
            console.log("saveMyBook: found record username", username);
            result.books.push({
                bookID: bookID,
                state: "On Shelf"
            });
            result.save();
        }
        else {
            console.log("saveMyBook: NOT found record username", username);
            var newUserBook = new MyBooks({
                username: username,
                books: [{bookID: bookID, state: "On Shelf"}]
            });
            newUserBook.save();
        }
    });
    next();

}

// submit title to google books api
module.exports.searchBooks = function(req, res) {
    var title = req.query.title;
    var url = "https://www.googleapis.com/books/v1/volumes?q=" + title + "&orderBy=newest&key=" + apiKey;
    console.log("api searchbooks: ", title, url);
    
        //get bars info
    var requestOptions = {
        url: url,
        method: 'GET',
        json: true
    };
    
    request(requestOptions, function(err, response, data){
        if (err) console.log("err in app-api: ", err);
        //console.log("google api res: ", data);
        return sendJSONresponse(res, 200, data.items);
    });

}

var saveBook = async function(thisbook){
    console.log("saveBook - this book", thisbook.title, thisbook.id);
    Book.findOne({googleID: thisbook.id}, function(err, book){
        //console.log("saveBook - within Book.findOne", book.title, book.id);

    if (book) { // book found in DB, update # copies and save to MyBooks
        console.log("ZZZ found book: ", book._id);
        book.numCopies += 1;
        bookID = book._id;
        book.save();
        saveMyBook(bookID);
    }

    // if book not found
    else {
        //console.log("ZZZ did not find book: ", bookID);
        var newBook = new Book({ //save book into Book DB
            googleID: thisbook.id,
            etag: thisbook.etag,
            title: thisbook.volumeInfo.title,
            anthors: thisbook.volumeInfo.authors,
            publisher: thisbook.volumeInfo.publisher,
            publishedDate: thisbook.volumeInfo.publishedDate,
            description: thisbook.volumeInfo.description,
            saleInfo: {
                country: thisbook.saleInfo.retailPrice.country,
                price: thisbook.saleInfo.retailPrice.amount,
                currencyCode: thisbook.saleInfo.retailPrice.currencyCode,
            },
            industryIdentifiers: thisbook.volumeInfo.industryIdentifiers,
            thumbnail: thisbook.volumeInfo.imageLinks.thumbnail,
            numOwners: 1,
            numCopies: 1,
            numBorrowedtimes: 0,
            });

        newBook.save().then(function(nb){
            bookID = nb._id;
            console.log("new book saved: ", nb.title, nb._id, bookID);
            saveMyBook(bookID);
        });
    }

});
}

// update database with selected books from search
module.exports.handleSelectedBooks = async function(req, res, next) {
    var books = JSON.parse(req.body['uploaded']);
    username = req.body['username'];
    var bookID;

    console.log("api handleSelectedBooks: username ", username);
    
    //save selected Books 
    for (const book of books){
        await saveBook(book);
    }
    /*
    var promises = books.map(book => {
        console.log("books.map: this book", book);
        await saveBook(book);
        return book;
        });
    Promise.all(promises).then(function(books){
    console.log("Promises: saveBook-all returned");
    }).catch(function(err){console.log("promises error!!!!");});
    */
    console.log("handleSelectedBooks: saved");
    next();
}

var count = 0;
/*
// This does not work - it works the first time: but hangs before myBooks.push. Dont know why
var findBook = function(element, myBooks){
    var query = { _id: ObjectId(element.bookID) };
    //console.log("findBook: query = ", query, element);
    return new Promise(resolve => {

        Book.findOne(query, function(err, book){
            if (book) {
                console.log("findBook - found Book ->", book.title, myBooks.length);
                myBooks.push({
                    thumbnail: book.thumbnail,
                    state: element.state
                });
                count += 1;
                console.log("findBook: ", count, myBooks[count-1].thumbnail);
                resolve(myBooks);
            }
        });
    });
}
*/

// The purpose of this segment findBook is to enrich data with thumbnail and other related info. Parameter 'action' 
// indicates the request type and the enrichment varies accordingly
// in this code, each iteration returns one obj (instead of pushing into myBooks which was passed along element in findBook,
// but did not wor after second time - it hangs right before myBooks.push. Dont know why)
var findBook = function(element, username, action){
    var query = { _id: ObjectId(element.bookID) };
    var obj = {};
    //console.log("findBook: query = ", query, element);
    return new Promise(resolve => {

        Book.findOne(query, function(err, book){
            if (book) {
                console.log("findBook - found Book ->", book.title);
                if (action === "mybooks" || action === "request")
                    obj = {"bookID": element.bookID, "thumbnail": book.thumbnail,
                        "state": element.state, "ownerOfBook": username};
                else if (action === "borrowed") {
                    var days =Math.floor((new Date() - element.borrowedAt)/(1000*60*60*24));
                    console.log("ZZZZZZZZ days = ", days);
                    obj = {"bookID": element.bookID, "thumbnail": book.thumbnail,
                        "ownerOfBook": element.ownerOfBook, "borrowedAt": element.borrowedAt, "duration": element.duration, due: days, status: element.status};
                }
                else if (action === "lent")
                    obj = {"bookID": element.bookID, "thumbnail": book.thumbnail,
                        "borrower": element.borrower, "lentAt": element.lentAt, "duration": element.duration, status: element.status};
                else if (action === "requested")
                    obj = {"bookID": element.bookID, "thumbnail": book.thumbnail,
                        "ownerOfBook": element.ownerOfBook, "requestedAt": element.requestedAt, "status": element.status, "duration": element.duration};
                else if (action === "lend")
                    obj = {"bookID": element.bookID, "thumbnail": book.thumbnail,
                        "numRequests": element.numRequests, "requestDuration": element.requestDuration};
                else;
                count += 1;
                console.log("findBook: ", count, obj);
                resolve(obj); //resolve returns the value
            }
        });
    });
}

module.exports.getMyBooks = async function(req, res){
    var username = req.params.username;
    var myBooks = [];
    console.log("XXX username = ", username);
    var query = {username: username};
    console.log("getMyBooks: query = ", query);
    MyBooks.findOne(query, function(err, bookref){
        if(err) {console.log("API getMyBooks: failed to get data:", bookref, err); return res.status(500).json(err);}
        else if (bookref) {
            void async function(){
                for (const book of bookref.books) {
                    console.log("API getMyBooks for loop before await: book = ", book.bookID);
                    myBooks.push(await findBook(book, username, "mybooks")); //myBooks picks up the value
                    console.log("API getMyBooks for loop after await: book = ", book.bookID);
                    }
                console.log("getMyBooks API: updated myBooks", myBooks.length, myBooks[0]);
                return sendJSONresponse(res, 200, myBooks); 
            }();
        }
        else {return sendJSONresponse(res, 200, myBooks); }
        /*
        if (bookref) {
            console.log("before findBook:", bookref);
            var promises = bookref.books.map((element) => {findBook(element);});
            Promise.all(promises).then(function(myBooks){
                console.log("Promises: returned", myBooks);
                sendJSONresponse(res, 200, myBooks);
            }).catch(function(err){console.log("promises error!!!!");});
        }
        */
    });
}
// ------
// get list of my borrowed books
module.exports.getMyBorrowedBooks = async function(req, res){
    var username = req.params.username;
    console.log("XXX username = ", username);
    var query = {username: username};
    var myBorrowedBooks = [];
    console.log("getMyBorrowedBooks: query = ", query);
    MyBorrowedBooks.findOne(query, function(err, bookref){
        console.log("API MyBorrowedBooks - bookref", bookref, err);
        if(err) {console.log("API getMyBorrowedBooks: failed to get data:", bookref, err); return res.status(500).json(err);}
        else if (bookref) {
            void async function(){
                for (const book of bookref.books) {
                    console.log("API getMyBorrowedBooks for loop before await: book = ", book.bookID);
                    myBorrowedBooks.push(await findBook(book, username, "borrowed")); //myBooks picks up the value
                    console.log("API getMyBorrowedBooks for loop after await: book = ", book.bookID);
                    }
                console.log("getMyBorrowedBooks API: updated myBooks", myBorrowedBooks.length, myBorrowedBooks[0]);
                return sendJSONresponse(res, 200, myBorrowedBooks); 
            }();            
            
            /*
            console.log("API getMyBorrowedBooks: OK ");
            if (typeof bookref.books === "undefined")
                return sendJSONresponse(res, 200, []); 
            else
                return sendJSONresponse(res, 200, bookref.books); 
                */
        }
        else {return sendJSONresponse(res, 200, []); } // nothing is found 
    });
}
// get list of my lent books
module.exports.getMyLentBooks = async function(req, res){
    var username = req.params.username;
    console.log("XXX username = ", username);
    var query = {username: username};
    var myLentBooks = [];
    console.log("getMyLentBooks: query = ", query);
    MyLentBooks.findOne(query, function(err, bookref){
        console.log("API MyLentBooks - bookref", bookref, err);
        if(err) {console.log("API getMyLentBooks: failed to get data:", bookref, err); return res.status(500).json(err);}
        else if (bookref) {
            void async function(){
                for (const book of bookref.books) {
                    console.log("API getMyLentBooks for loop before await: book = ", book.bookID);
                    myLentBooks.push(await findBook(book, username, "lent")); //myLentBooks picks up the value
                    console.log("API getMyLentBooks for loop after await: book = ", book.bookID);
                    }
                console.log("getMyLentBooks API: updated myBooks", myLentBooks.length, myLentBooks[0]);
                return sendJSONresponse(res, 200, myLentBooks); 
            }();            
            
            /*
            console.log("API getMyLentBooks: OK ", bookref.books);
            if (typeof bookref.books === "undefined")
                return sendJSONresponse(res, 200, []); 
            else
                return sendJSONresponse(res, 200, bookref.books);   
            */
        }
        else {return sendJSONresponse(res, 200, []); } // nothing is found 
    });
}
// get list of my requests
module.exports.getMyRequestedBooks = async function(req, res){
    var username = req.params.username;
    console.log("XXX username = ", username);
    var query = {username: username};
    var myRequestedBooks = [];
    console.log("getMyRequestedBooks: query = ", query);
    MyRequestedBooks.findOne(query, function(err, bookref){
        console.log("API MyRequestedBooks - bookref", bookref, err);
        if(err) {console.log("API getMyRequestedBooks: failed to get data:", bookref, err); return res.status(500).json(err);}
        else if (bookref) {
            void async function(){
                for (const book of bookref.books) {
                    console.log("API getMyRequestedBooks for loop before await: book = ", book.bookID);
                    if (book.status === "Pending") // only send 'Pending' books
                        myRequestedBooks.push(await findBook(book, username, "requested")); //myRequestedBooks picks up the value
                    console.log("API getMyRequestedBooks for loop after await: book = ", book.bookID);
                    }
                console.log("getMyRequestedBooks API: updated myBooks", myRequestedBooks.length, myRequestedBooks[0]);
                return sendJSONresponse(res, 200, myRequestedBooks); 
            }();            
            
            /*
            console.log("API getMyRequestedBooks: OK ", bookref.books);
            if (typeof bookref.books === "undefined")
                return sendJSONresponse(res, 200, []); 
            else
                return sendJSONresponse(res, 200, bookref.books);  
                */
        }
        else {return sendJSONresponse(res, 200, []); } // nothing is found 
    });
}
// ----


// prepare list of available books and send to requestbooks/ctrlview
module.exports.requestBooks = function(req, res){
    var username = req.params.username;
    var availableBooks = [];
    console.log("XXX username = ", username);
    var query = {username: username};
    console.log("requestBooks: query = ", query);
    MyBooks.find().exec(function(err, data){
        if(err) {console.log("API requestBooks: failed to get data:", err); return res.status(500).json(err);}
        else if (data) {
            void async function(){
                for (var key in data) {
                    if (data[key].username != username) {
                        console.log("GGGGG data[key].books[0] =", data[key].books.length, data[key].books[0]);
                        for (const book of data[key].books) {
                            console.log("API requestBooks for loop before await: book = ", book.bookID);
                            if (book.state === "On Shelf"){
                                availableBooks.push(await findBook(book, data[key].username, "request")); //availableBooks picks up the value
                                console.log("API requestBooks for loop after await: book = ", book.bookID);
                            }
                        }   
                    }
                }
                

                //console.log("getMyBooks API: updated myBooks", availableBooks);
                return sendJSONresponse(res, 200, availableBooks);
        }();
        }
        else {return sendJSONresponse(res, 200, availableBooks);}
    });
}

// update database with requested books from user
module.exports.sendRequests = function(req, res) {
    var requests = JSON.parse(req.body['uploaded']);
    username = req.body['username'];
    var bookID;

    console.log("api sendRequests: username requests", username, requests);
    
    //save borrow requests 
    MyRequestedBooks.findOne({username: username}, function(err, data) {  
        if (err) return res.status(500).json(err);
        else if (data) {
            for (let i = 0; i < requests.length; ++i){
                data.books.push({
                    bookID: requests[i].bookID,
                    ownerOfBook: requests[i].ownerOfBook,
                    status: "Pending",
                    duration: requests[i].duration,
                    lendDuration: 30
                });
            }
            data.save();
            return res.status(200).end();
        }
        else return res.status(200).end();
    });
}

// prepare list of my requested books and send to borrowbooks/ctrlview
module.exports.borrowBooks = function(req, res){
    var username = req.params.username;
    console.log("XXX username = ", username);
    var query = {username: username};
    var borrowBooks = [];
    console.log("API borrowBooks: query = ", query);
    MyRequestedBooks.findOne(query, function(err, data){
        if(err) {console.log("API borrowBooks: failed to get data:", err); return res.status(500).json(err);}
        else if (data) {  
            // get MyLendBooks to enrich borrowBooks - it is here to avoid complicated async problems
            MyLentBooks.find().exec(function(err, docs){
                if(err) console.log(err);
                console.log("API borrowBooks - MyLentBooks: ", docs);
                
                void async function(){

                    for (const book of data.books) {
                        console.log("API borrowBooks for loop before await: book = ", book.bookID);
                        if (book.status === "Pending")
                            borrowBooks.push(await findBook(book, username, "requested")); //borrowBooks picks up the value
                        console.log("API borrowBooks for loop after await: book = ", book.bookID);
                        }
                    console.log("borrowBooks API: updated myBooks", borrowBooks.length, borrowBooks[0]);
                
                    // enrich borrowBooks with if owners have confirmed already
                    for (let i = 0; i < borrowBooks.length; i++) 
                        for (let j = 0; j < docs.length; j++)
                            for (let k = 0; k < docs[j].books.length; k++) {
                                var str1 = borrowBooks[i].bookID.toString();
                                var str2 = docs[j].books[k].bookID.toString();
                                if ( (str1 === str2) && (docs[j].books[k].status === "Offered")){
                                    borrowBooks[i].ownerOfBook = docs[j].username;
                                    borrowBooks[i].status = "Lender Confirmed";
                                    borrowBooks[i].lendDuration = docs[j].books[k].duration;
                                    console.log("API borrowBooks - matching: ", borrowBooks[i]);
                                }
                            }
                    
                    return sendJSONresponse(res, 200, borrowBooks); 
                }();          
            });
            
            /*
            //console.log("getMyBooks API: updated myBooks", availableBooks);
            if (typeof data.books === "undefined")
                return sendJSONresponse(res, 200, []); 
            else
                return sendJSONresponse(res, 200, data.books); 
                */
        }
        else {return sendJSONresponse(res, 200, []);} // this should never happen 
    });
}

// update database with borrow confirmation from borrower
module.exports.borrowConfirmation = function(req, res) {
    var confirmedList = JSON.parse(req.body['uploaded']);
    username = req.body['username'];
    var bookID;

    console.log("api borrowConfirmation: username confirmedlist", username, confirmedList);
    
    //save confirmedList to myBorrowedBooks
    void async function(){
        await MyBorrowedBooks.findOne({username: username}, function(err, data){
            if(err) return res.status(500).json(err);
            else if(data){
                for (const book of confirmedList) {
                    data.books.push({
                        bookID: book.bookID,
                        borrowedAt: new Date(),
                        ownerOfBook: book.ownerOfBook,
                        duration: book.duration
                    });
                }
                data.save();
                console.log("API borrowConfirmation 1 - updating myBorrowedBooks: ", data.books);
            }
            else console.log("API borrowConfirm: no data");
        });
    }();    

    //update confirmedList to MyRequestedBooks
    void async function(){
        for (const book of confirmedList) {
            await MyRequestedBooks.findOne({username: username}, function(err, data){
                if(err) return res.status(500).json(err);
                for(let i = 0; i < data.books.length; i++){
                    if(data.books[i].bookID.toString() === book.bookID.toString()) {
                        data.books[i].ownerOfBook = book.ownerOfBook;
                        data.books[i].lendDuration = book.duration;
                        data.books[i].confirmedByBorrowedAt = new Date();
                        data.books[i].status = "Borrower Confirmed";
                    }
                }
                console.log("API borrowConfirm 2 - updating myrequestedbooks");
                data.save(); 
            });
        }
    }();    
    
    //update confirmedList to MyLentBooks
    void async function(){
        for (const book of confirmedList) {
            await MyLentBooks.findOne({username: book.ownerOfBook}, function(err, data){
                if(err) return res.status(500).json(err);
                for(let i = 0; i < data.books.length; i++){
                    if(data.books[i].bookID.toString() === book.bookID.toString()) {
                        data.books[i].borrowedAt = new Date();
                        data.books[i].borrower = username;
                        data.books[i].status = "Taken";
                        data.books[i].duration = book.duration;
                    }
                }
                console.log("API borrowConfirm 3 - updating mylendbooks");
                data.save(); 
            });
        }
    }();   

    //update books.state of myBooks
    void async function(){
        for (const book of confirmedList) {
            await MyBooks.findOne({username: book.ownerOfBook}, function(err, data){
                if(err) return res.status(500).json(err);
                for(let i = 0; i < data.books.length; i++){
                    if(data.books[i].bookID.toString() === book.bookID.toString()) {
                        data.books[i].state = "On Loan";
                    }
                }
                console.log("API borrowConfirm 4 - updating mybooks");
                data.save(); 
            });
        }
    }();   
    
    console.log("API borrowConfirm - after async loops, before submit return end()");
    return res.status(200).end();
}

//----

// prepare list of requested books I own and send to lendbooks/ctrlview
module.exports.lendBooks = function(req, res){
    var username = req.params.username;
    console.log("XXX username = ", username);
    var query = {username: username};
    console.log("lendBooks: query = ", query);
    MyRequestedBooks.find().exec(function(err, data){ // first get entire list of requestedBooks
        console.log("API lendBooks - data after query", data);
        if(err) {console.log("API lendBooks: failed to get data:", err); return res.status(500).json(err);}
        else if (data) {  
            // compile list of requested books by all including me, and summarize by books
            console.log("API lendBooks - data.length, data[0]", data.length, data[0]);
            var lendBooks = [];
            for ( let i = 0; i < data.length; i++) {
                if( data[i].books.length > 0) {
                    for (let k = 0; k < data[i].books.length; k++) {
                        var found = false;
                        for (let j = 0; j < lendBooks.length; j++) {
                            var str1 = lendBooks[j].bookID.toString();
                            var str2 = data[i].books[k].bookID.toString();
                            console.log("API lendBooks - compare bookIDs str1 str2: ", str1, str2);
                            if (str1 === str2) {
                                lendBooks[j].numRequests += 1;
                                lendBooks[j].requestDuration += data[i].books[k].duration;
                                found = true;
                            }
                        }
                        if(!found && data[i].books.length > 0) {
                            lendBooks.push({
                                bookID: data[i].books[k].bookID,
                                requestDuration: data[i].books[k].duration,
                                numRequests: 1
                            });
                        }
                    }
                }
            }
            
            // search through lendBooks to find if I own the books that I can lend, remove rest
            console.log("API lendBooks - all requested books", lendBooks.length, lendBooks);
            var lendBooksFilter = new Array(lendBooks.length);
            lendBooksFilter.fill(0); // if element is 1, it indicates the book I own
            MyBooks.findOne({username: username}, function(err, mybooks){
                console.log("API lendBooks - all myBooks ", mybooks, mybooks.books.length);
                if(err) console.log(err);
                else if (mybooks) {
                    for (let i = 0; i < mybooks.books.length; i++) {

                        for(let j = 0; j < lendBooks.length; j++) {
                            var str1 = mybooks.books[i].bookID.toString();
                            var str2 = lendBooks[j].bookID.toString();
                            console.log("API lendBooks - compare bookIDs str1 str2: ", str1, str2);
                            if (str1 === str2 && mybooks.books[i].state === "On Shelf") {
                                lendBooksFilter[j] = 1;
                            }
                        }
                    }
                    // filter array by creating a new array with only my owned books
                    var lendMyBooks = [];
                    for(let i = 0; i < lendBooks.length; i++){
                        //calculate avg duration before filtering
                        lendBooks[i].requestDuration = Math.floor(lendBooks[i].requestDuration/lendBooks[i].numRequests);
                        if (lendBooksFilter[i] === 1) {
                            lendMyBooks.push(lendBooks[i]);
                        }
                    }
                    
                    //add thumbnail to lendMyBooks
                     void async function(){
                        var list = [];
                        for (let i = 0; i < lendMyBooks.length; i++) {
                            console.log("API lendBooks for loop before await: book = ", lendMyBooks[i].bookID);
                            list.push(await findBook(lendMyBooks[i], username, "lend")); //borrowBooks picks up the value
                            console.log("API lendBooks for loop after await: book = ", lendMyBooks[i].bookID);
                            }
                        console.log("API lendBooks: updated my lendable Books", list.length, list);
                        return sendJSONresponse(res, 200, list); 
                    }();                      
                }
                else;
            });
        }
        else {return sendJSONresponse(res, 200, []);} // this should never happen 
    });
}

// update database with lend confirmation: going through all lendConfirm books and update status in myrequestedbooks and MyLentBooks
module.exports.lendConfirmation = function(req, res) {
    var confirmedList = JSON.parse(req.body['uploaded']);
    username = req.body['username'];
    var bookID;

    console.log("api lendConfirmation: username confirmedlist", username, confirmedList);
    for (let i = 0; i < confirmedList.length; i++) { // for each book to lend
        MyBooks.findOne({username: username}, function(err, book){
            if (err) console.log(err);
            else if (book) {
                for (let j = 0; j < book.books.length; j++) {
                    var str1 = book.books[j].bookID.toString();
                    var str2 = confirmedList[i].bookID.toString();
                    if (str1 === str2) {
                        book.books[j].state = "To Be Lent";
                        book.save(function(err){
                            if (err) console.log(err);

                            MyLentBooks.findOne({username: username}, function(err, data){
                                if (err) console.log(err);
                                var bookToBeLent = 
                                    {bookID: confirmedList[i].bookID,
                                     borrower: "TBD", // required field, use me for the time being, coorected to real borrower after borrowconfirmation
                                     lentAt: new Date(),
                                     borrowedAt: "",
                                     returnedAt: "",
                                     status: "Offered",
                                    duration: confirmedList[i].duration};
                                console.log("IN HERE - bookToBeLent", bookToBeLent, data);
                                
                                data.books.push(bookToBeLent);
                                data.save(function(err, doc){
                                    if(err) console.log("saving err:", err);
                                    console.log("IN HERE saving data");
                                    return res.status(200).end();
                                });
                                });
                            });
                        }
                    }
                }
            });
        }
    }
    
// return books: update the following
// update myrequestedbooks: current user account, change status to 'history'
// update myborrowedbooks: current user acc, change returned date to today
// update mylentboooks: owner acc,  change returned date to today
// update mybooks: owner acc, change bookID state to "On Shelf"
module.exports.returnBook = function(req, res) {
    var bookID = req.body['bookID'];
    var username = req.body['username'];
    var owner = req.body['owner'];

    console.log("api returnbook: username bookID owner", username, bookID, owner);
    
    // update myborrowedbooks: current user acc, change returned date to today
    void async function(){
        await MyBorrowedBooks.findOne({username: username}, function(err, data){
            if(err) return res.status(500).json(err);
            else if(data){
                for (const book of data.books) {
                    if(book.bookID.toString() === bookID.toString()){
                        book.returnedAt = new Date();
                        book.status = "History";
                    }
                    data.save();
                }
                console.log("API returnB 1 - updating myBorrowedBooks: ", bookID);
            }
            else console.log("API returnB: no data");
        });
    }();    

    // update myrequestedbooks: current user account, change status to 'history'
    void async function(){
        await MyRequestedBooks.findOne({username: username}, function(err, data){
            if(err) return res.status(500).json(err);
            for(let i = 0; i < data.books.length; i++){
                if(data.books[i].bookID.toString() === bookID.toString()) {
                    data.books[i].status = "History";
                }
            }
            console.log("API returnB 2 - updating myrequestedbooks");
            data.save(); 
        });
    }();    
    
    // update mylentboooks: owner acc,  change returned date to today
    void async function(){
        await MyLentBooks.findOne({username: owner}, function(err, data){
            if(err) return res.status(500).json(err);
            for(let i = 0; i < data.books.length; i++){
                if(data.books[i].bookID.toString() === bookID.toString()) {
                    data.books[i].returnedAt = new Date();
                    data.books[i].status = "History";
                }
            }
            console.log("API returnB 3 - updating mylendbooks");
            data.save(); 
        });
    }();   

    // update mybooks: owner acc, change bookID state to "On Shelf"
    void async function(){
            await MyBooks.findOne({username: owner}, function(err, data){
                if(err) return res.status(500).json(err);
                for(let i = 0; i < data.books.length; i++){
                    if(data.books[i].bookID.toString() === bookID.toString()) {
                        data.books[i].state = "On Shelf";
                    }
                }
                console.log("API returnB 4 - updating mybooks");
                data.save(); 
            });
    }();   
    
    console.log("API returnB - after async loops, before submit return end()");
    return res.status(200).end();
}
