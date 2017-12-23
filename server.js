var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

//if deployed, use deployed db, else us local db

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/ArticlesDB";

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Routes

// A GET route for scraping the NPR website
app.get("/scrape", function(req, res) {

  var linkURLs = []

  db.Article
    .find({})
    .then(function(articles){
      for (var i=0; i<articles.length; i++){
        if (articles[i].link){
        linkURLs.push(articles[i].link)
        }
      }

      console.log("link urls: "+linkURLs)
       // First, we grab the body of the html with request
      axios.get("https://www.npr.org/").then(function(response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h1 within a title class, and do the following:
        $("h1.title").each(function(i, element) {

          //if the url of the element is already in our linksurl, return

          if (linkURLs.indexOf($(element).parent().attr("href")) !== -1) {
            return
          }

          // Save an empty result object
          var result = {};

          // Add the text and href of every land save them as properties of the result object
          result.title = $(element).text()

          result.link = $(element).parent().attr("href")

          //if there is no link, return
          if (!result.link){
            return
          }

          result.snippet = $(element).parent().next().children().text()


          // Create a new Article using the `result` object built from scraping
          db.Article
          .create(result)
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
          
          
        })
        res.send("scrape completed")

      });
    })
    .catch(function(err){
      console.log(err)
    })


  // // First, we grab the body of the html with request
  // axios.get("https://www.npr.org/").then(function(response) {
  //   // Then, we load that into cheerio and save it to $ for a shorthand selector
  //   var $ = cheerio.load(response.data);

  //   // Now, we grab every h1 within a title class, and do the following:
  //   $("h1.title").each(function(i, element) {

  //     if (linkURLs.indexOf($(element).attr("href") > -1)) {

  //       // Save an empty result object
  //       var result = {};

  //       // Add the text and href of every link, and save them as properties of the result object
  //       result.title = $(element).text()

  //       result.link = $(element).parent().attr("href")

  //       result.snippet = $(element).parent().next().children().text()

  //       // Create a new Article using the `result` object built from scraping
  //       db.Article
  //         .create(result)
  //         .then(function(dbArticle) {
  //           // If we were able to successfully scrape and save an Article, send a message to the client
  //           res.send("Scrape Complete");
  //         })
  //         .catch(function(err) {
  //           // If an error occurred, send it to the client
  //           res.json(err);
  //         });

  //     }
  //   });
  // });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article
    .find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/articles/saved", function(req, res) {
  // Grab every document in the Articles collection
  db.Article
    .find({saved: true})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


//route for saving/unsaving a particular article

app.post("/articles/save/:boolean/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Article
  .findOneAndUpdate({_id: req.params.id}, {saved: req.params.boolean}, {new: true})
  .then(function(dbArticle) {
    // If we were able to successfully update an Article with the given id, send it back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  });
});

//route for saving a note

app.post("/notes/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {note: dbNote._id} }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//route for getting notes of a specific article
app.get("/notes/:id", function(req, res) {
  // Grab every document in the Articles collection
  db.Article
    .find({_id: req.params.id})
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/notes/delete/:id", function(req, res){
  db.Note
  .remove({_id: req.params.id})
  .then(function(note) {
    res.json(note)
  })
  .catch(function(err) {
    res.json(err)
  })
})


app.get("/saved", function(req, res) {
    res.sendFile(path.join(__dirname, "/public/saved.html"));
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
