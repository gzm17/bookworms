var mongoose = require("mongoose");
var User = require("../models/user");

//This defines the books schema for mongoose, a small subset of google books api
var bookSchema = mongoose.Schema({
    googleID: {type: String, required: true, unique: true},
    etag: {type: String, required: true, unique: true},
    title: {type: String, required: false},
    anthors: [],
    publisher: {type: String, required: false},
    publisheddate: {type: Date, required: false},
    description: {type: String, required: false},
    industryIdentifiers: [
        {
            "type": {type: String, required: false},
            "identifier": {type: String, required: false}
        },
        {
            "type": {type: String, required: false},
            "identifier": {type: String, required: false}
        }
    ],
    saleInfo: {
        country: {type: String, required: false},
        price: {type: Number, required: false},
        currencyCode: {type: String, required: false},
    },
    thumbnail: {type: String, required: false},
    numOwners: {type: Number, required: false},
    numBorrowedtimes: {type: Number, required: false},
    numCopies: {type: Number, required: false}
});

//adding a method to get book name to the schema
bookSchema.methods.getBooks = function (){
    return this; 
};

var Book = mongoose.model("Book", bookSchema);


module.exports = Book;


