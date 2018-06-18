var mongoose = require("mongoose");
var User = require("../models/user");
var Book = require("../models/book");

//This defines myLentBooks schema for mongoose: duration (length of time) is in weeks
var myLentBooksSchema = mongoose.Schema({
    username: {type: mongoose.Schema.Types.String, ref: 'User'},
    books: [
        {
            bookID: {type: mongoose.Schema.Types.ObjectId, ref: 'Book'},
            borrower: {type: String, required: true},
            lentAt: {type: Date}, // lender confirmed date
            borrowedAt: {type: Date}, // not always the same as lentAt. time gap between confirmations
            returnedAt: {type: Date},
            status: {type: String, enum: ["Offered", "Taken", "History"], default: "Offered"},
            duration: {type: Number, required: true} 
        }
    ]
});

//adding a method to get my lent books to the schema
myLentBooksSchema.methods.getMyLentBooks = function (){
    return this; 
};

var MyLentBooks = mongoose.model("MyLentBooks", myLentBooksSchema);

module.exports = MyLentBooks;

