var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var path = require('path');
var express = require('express');

FileDriver = function(db) {
    this.db = db;
};

FileDriver.prototype.getCollection = function(callback) {
    this.db.collection('photos', function(error, collection) {
        if(error)
            callback(error);
        else
            callback(null, collection);
    });
};

FileDriver.prototype.findAll = function(callback) {
    this.getCollection(function(error, collection) {
        if(error)
            callback(error);
        else {
            collection.find().toArray(function(error, results) {
                if(error)
                    callback(error);
                else
                    callback(null, results);
            });
        }
    });
};

FileDriver.prototype.get = function(id, callback) {

    this.getCollection(function(error, collection) {
        if(error)
            callback(error);
        else {
            var hexCheck = new RegExp("^[0-9a-fA-F]{24}$");
            if(!hexCheck.test(id)) {
                callback({ error: "Invalid ID" });
            } else {
                collection.findOne({ '_id': ObjectID(id) }, function(error, result) {
                    if(error)
                        callback(error);
                    else
                        callback(null, result);
                });
            }
        }
    });
};

FileDriver.prototype.save = function(obj, callback) {
    this.getCollection(function(error, collection) {
        if(error)
            callback(error);
        else {
            obj.created_at = new Date();
            collection.insert(obj, function() {
                callback(null, obj);
            });
        }
    });
};

FileDriver.prototype.handleGet = function(req, res) {
    var id = req.params.id;

    if(!id)
        res.status(404).send('file not found');
    else {
        this.get(id, function(error, result) {
            if(error)
                res.status(400).send(error);
            else {
                if(!result)
                    res.send(404, 'file not found');
                else {
                    var fname = id + result.ext;

                    var options = {
                        root: __dirname + "/uploads/",
                        dotfiles: 'allow',
                        headers: {
                            'x-timestamp': Date.now(),
                            'x-sent': true
                        }
                    };

                    res.sendFile(fname, options, function(err) {
                        if(err) {
                            console.log(err);
                            //res.status(err.status).end();
                        } else
                            console.log("successfully got file: " + fname);
                    });
                }
            }
        });
    }
};

FileDriver.prototype.handleUploadRequest = function(req, res, callback) {
    var image = req.file; 
    console.log(image);
    var contentType = image.mimetype;
    var ext = contentType.substr(contentType.indexOf('/') + 1);
    if(ext)
        ext = '.' + ext;
    else
        ext = '';

    this.save({
        'content-type': contentType,
        'ext': ext
    }, function(error, result) {
        if(error)
            res.send(400, error);
        else {
            var id = result._id;
            console.log("id: " + id);
            var fname = id + ext;

            fs.readFile( image.path, function (err, data) {
                if(err)
                    res.send(500, err);
                else {
                    fs.writeFile(path.resolve(__dirname + "/uploads/" + fname), data, function (err) {
                        callback(id, err);                       
                   });
                }
            });
        }
    });
};

exports.FileDriver = FileDriver;
