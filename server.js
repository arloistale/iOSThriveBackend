var express = require('express'),
    path = require('path'),
    mongodb = require('mongodb');

MongoClient = mongodb.MongoClient;
Server = mongodb.Server;
CollectionDriver = require('./collectionDriver').CollectionDriver;

// app definitions
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// set up mongodb
var mongoHost = 'localHost';
var mongoPort = 27017;
var collectionDriver;

var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.open(function(err, client) {
    if(!client) {
        console.error("Start Mongo first!");
        process.exit(1);
    }

    var db = client.db("MainDatabase");
    collectionDriver = new CollectionDriver(db);
});

// configure app
app.use(express.bodyParser());

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/:collection', function(req, res) {
    var params = req.params;
    var collection = req.params.collection;

    collectionDriver.findAll(collection, function(error, results) {
        if(error)
            res.send(400, error);
        else {
            if(req.accepts('html')) {
                res.render('data', {
                    objects: results,
                    collection: req.params.collection
                });
            } else {
                res.set('Content-Type', 'application/json');
                res.send(200, {
		    data: results
                });
            }
        }
    });
});

app.post('/:collection', function(req, res) {
    var obj = req.body;
    var collection = req.params.collection;

    collectionDriver.save(collection, obj, function(error, result) {
        if(error)
            res.send(400, error);
        else
            res.send(201, result);
    });
});

app.get('/:collection/:entity', function(req, res) {
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;

    if(entity) {
        collectionDriver.get(collection, entity, function(error, results) {
            if(error)
                res.send(400, error);
            else
                res.send(200, results);
        });
    } else {
        var error = {
            message: "Bad URL: " + req.url
        };
        res.send(400, error);
    }
});

app.put('/:collection/:entity', function(req, res) {
    var params = req.params;
    var body = req.body;
    var collection = params.collection;
    var entity = params.entity;

    if(entity) {
        collectionDriver.update(collection, body, entity, function(error, result) {
            if(error)
                res.send(400, error);
            else
                res.send(200, result);
        });
    } else {
        var error = {
            message: "Bad URL: " + req.url
        };
        res.send(400, error);
    }
});

app.delete('/:collection/:entity', function(req, res) {
    var params = req.params;
    var collection = params.collection;
    var entity = params.entity;

    if(entity) {
        collectionDriver.delete(collection, entity, function(error, result) {
            if(error)
                res.send(400, error);
            else
                res.send(200, result);
        });
    } else {
        var error = {
            message: "Bad URL: " + req.url
        };
        res.send(400, error);
    }
});

app.use(function(req, res) {
    res.render('404', { url: req.url });
});

// start app
app.listen(process.env.PORT || 8081, function() {

});
