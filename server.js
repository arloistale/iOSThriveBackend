var express = require('express'),
    multer = require('multer'),
    bodyParser = require('body-parser'),
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

// set up bodyParser

app.use(bodyParser.json());                        
app.use(bodyParser.urlencoded({ extended: true }));

// set up multer
var upload = multer({ dest: 'uploads/' });

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    var params = req.params;
    
    // the home page renders a card list
    collectionDriver.findAll(collection, function(error, results) {
        if(error)
            res.send(400, error);
        else {
            if(req.accepts('html')) {
                res.render('home', {
                    objects: results,
                });
            } else {
                res.set('Content-Type', 'application/json');
                res.send(403, {});
            }
        }
    });

});

app.get('/lucky', function(req, res) {
    collectionDriver.getRandom(collection, function(err, result) {
        if(err)
            res.status(400).send(err);
        else if(!result) {
            res.status(404).send("Couldn't get a lucky record!");
        } else {
            if(req.accepts('html')) {
                res.render('home', {
                    objects: [result]
                });
            } else {
                res.set('Content-Type', 'application/json');
                res.status(200).send({ data: result });
            }
        }
    }); 
});

app.get('/photos', function(req, res) {
    var params = req.params;
    
    fileDriver.findAll(function(error, results) {
        if(error)
            res.status(400).send(error);
        else {
            if(req.accepts('html')) {
                res.render('dataupload', {
                    objects: results
                });
            } else {
                res.set('Content-Type', 'application/json');
                res.status(403).send({});
            }
        }
    });
});

app.post('/photos', function(req, res) {
    fileDriver.handleUploadRequest(req, res);
});

app.get('/photos/:id', function(req, res) {
    var id = req.params.id;

    if (id) {
        fileDriver.handleGet(req, res);
    } else {
        var error = {
            message: "Bad URL: " + req.url
        };
        res.status(400).send(error);
    }
});

app.get('/cards', function(req, res) {
    var params = req.params;
    
    collectionDriver.findAll(collection, function(error, results) {
        if(error)
            res.status(400).send(error);
        else {
            if(req.accepts('html')) {
                res.render('home', {
                    objects: results,
                });
            } else {
                var responseObject = {
                    data: results
                };
                res.set('Content-Type', 'application/json');
                res.status(200).send(responseObject);
            }
        }
    });
});

app.post('/cards', upload.single('image'), function(req, res) {
    var obj = req.body;

    // TODO: make sure to block post requests from native apps

    // poll until file saved
    fileDriver.handleUploadRequest(req, res, function(id, err) {
        if (err)
            res.status(500).send(err);
        else {
            obj.photoId = id;

            collectionDriver.save(collection, obj, function(error, result) {
                if(error)
                    res.status(400).send(error);
                else {
                    if(req.accepts('html'))
                        res.redirect('/cards');
                    else
                        res.status(201).send(result);
                }
            });
        }
    });
});

app.get('/cards/:id', function(req, res) {
    var params = req.params;
    var id = params.id;

    if(id) {
        collectionDriver.get(collection, id, function(error, results) {
            if(error)
                res.status(400).send(error);
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
