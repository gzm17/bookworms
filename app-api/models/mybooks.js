var mongoose = require("mongoose");
var User = require("../models/user");
var Book = require("../models/book");

//This defines the mybooks schema for mongoose
var myBooksSchema = mongoose.Schema({
    username: {type: mongoose.Schema.Types.String, ref: 'User'},
    books: [
        {
            bookID: {type: mongoose.Schema.Types.ObjectId, ref: 'Book'},
            acquiredAt: {type: Date, default: Date.now},
            state: {type: String, enum: ["On Shelf", "On Loan", "Being Read", "To Be Lent"], default: "On Shelf"},
        }
    ]
});

//adding a method to get lis of mybooks to the schema
myBooksSchema.methods.getMyBooks = function (){
    return this; 
};

var MyBooks = mongoose.model("MyBooks", myBooksSchema);

module.exports = MyBooks;


