var mongoose = require("mongoose");
var User = require("../models/user");
var Book = require("../models/book");

//This defines myBorrowedBooks schema for mongoose: duration (length of time) is in weeks
var myBorrowedBooksSchema = mongoose.Schema({
    username: {type: mongoose.Schema.Types.String, ref: 'User'},
    books: [
        {
            bookID: {type: mongoose.Schema.Types.ObjectId, ref: 'Book'},
            ownerOfBook: {type: String, required: true},
            borrowedAt: {type: Date},
            returnedAt: {type: Date},
            status: {type: String, enum: ["Borrowed", "History"], default: "Borrowed"},
            duration: {type: Number, required: true} //agreed duration
        }
    ]
});

//adding a method to get my borrowed books to the schema
myBorrowedBooksSchema.methods.getMyBorrowedBooks = function (){
    return this; 
};

var MyBorrowedBooks = mongoose.model("MyBorrowedBooks", myBorrowedBooksSchema);

module.exports = MyBorrowedBooks;

