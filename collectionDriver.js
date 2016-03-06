var ObjectID = require('mongodb').ObjectID;

CollectionDriver = function(db) {
    this.db = db;
};

CollectionDriver.prototype.getCollection = function(collectionName, callback) {
    this.db.collection(collectionName, function(error, collection) {
        if(error)
            callback(error);
        else
            callback(null, collection);
    });
};

CollectionDriver.prototype.findAll = function(collectionName, callback) {
    this.getCollection(collectionName, function(error, collection) {
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

CollectionDriver.prototype.get = function(collectionName, id, callback) {
    this.getCollection(collectionName, function(error, collection) {
        if(error)
            callback(error);
        else {
            var hexCheck = new RegExp("^[0-9a-fA-F]{24}$");
            if(!hexCheck.test(id)) {
                callback({
                    error: "Invalid ID"
                });
            } else {
                collection.findOne({
                    '_id': ObjectID(id)
                }, function(error, result) {
                    if(error)
                        callback(error);
                    else
                        callback(null, result);
                });
            }
        }
    });
};

CollectionDriver.prototype.save = function(collectionName, obj, callback) {
    this.getCollection(collectionName, function(error, collection) {
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

CollectionDriver.prototype.update = function(collectionName, obj, id, callback) {
    this.getCollection(collectionName, function(error, collection) {
        if(error)
            callback(error);
        else {
            obj._id = ObjectID(id); // set new object as the updated object
            obj.updated_at = new Date();
            collection.save(obj, function(error, result) {
                if(error)
                    callback(error);
                else
                    callback(null, obj);
            });
        }
    });
};

CollectionDriver.prototype.delete = function(collectionName, id, callback) {
    this.getCollection(collectionName, function(error, collection) {
        if(error)
            callback(error);
        else {
            collection.remove({ '_id': ObjectID(id) }, function(error, result) {
                if(error)
                    callback(error);
                else
                    callback(null, result);
            });
        }
    });
};

exports.CollectionDriver = CollectionDriver;
