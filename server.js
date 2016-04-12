var express = require('express'),
    path = require('path'),
    mongodb = require('mongodb');

MongoClient = mongodb.MongoClient;
Server = mongodb.Server;
CollectionDriver = require('./collectionDriver').CollectionDriver;
FileDriver = require('./fileDriver').FileDriver;

// app definitions
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// set up mongodb
var mongoHost = 'localHost';
var mongoPort = 27017;
var fileDriver;
var collectionDriver;

var collection = 'cards';

var uri = process.env.MONGOLAB_URI;
MongoClient.connect(uri, function(err, db) {
    if(err) {
        console.error("Couldn't connect: " + uri);
        process.exit(1);
    }

    fileDriver = new FileDriver(db);
    collectionDriver = new CollectionDriver(db);
});

// configure app
app.use(express.bodyParser());
//app.use(multer({ dest: './uploads' }));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/photos', function(req, res) {
    var params = req.params;
    
    fileDriver.findAll(function(error, results) {
        if(error)
            res.send(400, error);
        else {
            if(req.accepts('html')) {
                res.render('dataupload', {
                    objects: results
                });
            } else {
                res.set('Content-Type', 'application/json');
                res.send(403, {});
            }
        }
    });
});

app.post('/photos', function(req, res) {
    fileDriver.handleUploadRequest(req, res);
});

app.get('/photos/:id', function(req, res) {
    fileDriver.handleGet(req, res); 
});

app.get('/cards', function(req, res) {
    var params = req.params;
    console.log("Loading from " + collection);
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
                var responseObject = {
                    data: results
                };
                res.set('Content-Type', 'application/json');
                res.send(200, responseObject);
            }
        }
    });
});

app.post('/cards', function(req, res) {
    var obj = req.body;
    
    collectionDriver.save(collection, obj, function(error, result) {
        if(error)
            res.send(400, error);
        else {
            if(req.accepts('html'))
                res.redirect('/cards');
            else
                res.send(201, result);
        }
    });
});

app.get('/cards/:id', function(req, res) {
    var params = req.params;
    var id = params.id;

    if(id) {
        collectionDriver.get(collection, id, function(error, results) {
            if(error)
                res.send(400, error);
            else
                res.send(200, results);
        });
    } else {
        var error = { message: "Bad URL: " + req.url };
        res.send(400, error);
    }
});

app.put('/cards/:id', function(req, res) {
    var params = req.params;
    var body = req.body;
    var id = params.id;

    if(id) {
        collectionDriver.update(collection, body, id, function(error, result) {
            if(error)
                res.send(400, error);
            else
                res.send(200, result);
        });
    } else {
        var error = { message: "Bad URL: " + req.url };
        res.send(400, error);
    }
});

app.delete('/cards/:id', function(req, res) {
    var params = req.params;
    var id = params.id;

    if(id) {
        collectionDriver.delete(collection, id, function(error, result) {
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
