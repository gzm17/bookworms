var mongoose = require("mongoose");
var User = require("../models/user");
var Book = require("../models/book");

//This defines myRequestedBooks (to borrow) schema for mongoose: duration (length of time) is in weeks
var myRequestedBooksSchema = mongoose.Schema({
    username: {type: mongoose.Schema.Types.String, ref: 'User'},
    books: [
        {
            bookID: {type: mongoose.Schema.Types.ObjectId, ref: 'Book'},
            ownerOfBook: {type: String, required: true}, //initial requested book owner
            requestedAt: {type: Date},
            confirmedByBorrowerAt: {type: Date},
            status: {type: String, enum: ["Lender Confirmed", "Pending", "Borrower Confirmed", "History"], required: true},
            duration: {type: Number, required: true, default: 30},
            lendDuration: {type: Number, required: true, default: 30}
        }
    ]
});

//adding a method to get my borrowed books to the schema
myRequestedBooksSchema.methods.getMyRequestedBooks = function (){
    return this; 
};

var MyRequestedBooks = mongoose.model("MyRequestedBooks", myRequestedBooksSchema);

module.exports = MyRequestedBooks;
