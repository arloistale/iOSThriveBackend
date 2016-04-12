var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');

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
        res.send(404, 'file not found');
    else {
        this.get(id, function(error, result) {
            if(error)
                res.send(400, error);
            else {
                if(!result)
                    res.send(404, 'file not found');
                else {
                    var fname = id + result.ext;
                    var path = './uploads/' + fname;
                    res.sendfile(path);
                }
            }
        });
    }
};

FileDriver.prototype.handleUploadRequest = function(req, res) {

    var image = req.files.image;

    var contentType = image.type;//req.get("content-type");
    var ext = contentType.substr(contentType.indexOf('/') + 1);
    if(ext)
        ext = '.' + ext;
    else
        ext = '';

    var that = this;

    this.save({
        'content-type': contentType,
        'ext': ext
    }, function(error, result) {
        if(error)
            res.send(400, error);
        else {
            var id = result._id;
            var fname = id + ext;
            var path = __dirname + "/uploads/" + fname;

            fs.readFile( image.path, function (err, data) {
                if(err)
                    res.send(500, err);
                else {
                    fs.writeFile(path, data, function (err) {
                        if (err)
                            res.send(500, err);
                        else {
                            if(req.accepts('html')) {
                                that.findAll(function(error, results) {
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
                            } else {
                                res.set('Content-Type', 'application/json');
                                res.send(201, {'_id': id});
                            }
                        }
                    });
                }
            });
        }
    });
};

exports.FileDriver = FileDriver;
