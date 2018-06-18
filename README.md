# Bookworms
This is a freecodecamp fullstack project. Detailed requirements see:https://learn.freecodecamp.org/coding-interview-prep/take-home-projects/manage-a-book-trading-club/ requiring the following 'user-stories':
- User Story: I can view all books posted by every user.
- User Story: I can add a new book.
- User Story: I can update my settings to store my full name, city, and state.
- User Story: I can propose a trade and wait for the other user to accept the trade.

The boilerplate of this app was originally based on Express in Action book "Know about me" app (basically it handles authentication) and REST API implementation idea from Getting MEAN with Mongo, Express, Angular and Node by Simon Holmes. The code is reasonably structured, with all data handling strickly separate from view management.

The application implements a book lovers community with people who share books they own with others. The key logic is as follows:

1) Each user can 'get' books - this is simply an api to google books. Later can change this function other forms of acquisition such as buying from an e-commerce site;
2) Each user can request books owned by others to borrow. They can only request books whose state is 'On Shelf';
3) Each user can lend books by checking if there are outstanding requests on the books they own and are not reading;
4) Each member can then borrow books that have been confirmed by lender.
5) the cycle continues...

Thus each book may go through the following lifecycle: get by owner --> (read by owner) --> requested by borrower --> made available by owner to lend --> borrowed by borrower --> returned by borrower, and the cycle continues.

The FCC requirement is much simpler than what is implemented here - there a book is simply traded. Keeping track of book states was more time-consuming than originally thought. But worth the pain to get familiar with writing the logic correctly and get familiar with mongoose and async.

Two technical aspects new thus far are below: 
1) using Mongoose to do cross-references. Can be confusing if not careful;
2) Dealing with async requests since all DB operations are asynch. Promises/async-await come in handy.

This little app implemented all the user stories and more. This can be further improved:

1) Look and feel - no effort is spent on look-and-feel
2) the user interface can be improved (simplified);
3) add messaging between users;
4) users can add comments to books or lenders or borrowers;
5) mobile version;
6) modularize the code better - many functions, especially front-end, are duplicated with small differences, there are ways to do this nicer;

Then this will be a useful app. 

Although this app is about books, but can be anything with only small changes. 

Problems:
1) with data model being objects, db.find(query, function(err, doc){}) doc is returned as an array but findOne returns an object, although find() in mongo shell returns an object. Dont know why

Heroku deployment notes: 

- Mongodb based on mLab's free tier sandbox
- Followed instructions in https://forum.freecodecamp.org/t/guide-for-using-mongodb-and-deploying-to-heroku/19347
- in mongoose.connect(url), changed to mongoose.connect(url, {useMongoClient:true}) option. It receives WARNING: The `useMongoClient` option is no longer necessary in mongoose 5.x, please remove it.
- But without it, it does not pass mongodb authentication 

