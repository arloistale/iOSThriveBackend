var ObjectID = require('mongodb').ObjectID;

CollectionDriver = function(db) {
    this.db = db;
};

/**
 * Retrieves a collection from the db by name.
 * @param collectionName The name of the collection.
 * @param callback Callback function for retrieval.
 */
CollectionDriver.prototype.getCollection = function(collectionName, callback) {
    this.db.collection(collectionName, function(error, collection) {
        if(error)
            callback(error);
        else
            callback(null, collection);
    });
};

/**
 * Finds all records under a collection by name.
 * @param collectionName The name of the collection.
 * @param callback Callback function for query.
 */
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

/**
 * Gets a record with specified id and collection name.
 * @param collectionName The name of the collection.
 * @param id The id of the record.
 * @param callback Callback function for query.
 */
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

/**
 * Gets a random record for from the collection with the specified name.
 * @param collectionName The name of the collection.
 * @param callback Callback for the query.
 */
CollectionDriver.prototype.getRandom = function(collectionName, callback) {
    this.getCollection(collectionName, function(error, collection) {
        if(error)
            callback(error);
        else {
            var mCollection = collection;
            mCollection.count(function(err, count) {
                if(err)
                    callback(err);
                else {
                    var rand = Math.floor(Math.random() * count);
                    console.log(mCollection);
                    mCollection.findOne().skip(rand).exec(function(error, result) {
                        if(error)
                            callback(error);
                        else
                            callback(null, result);
                    });
                }
            });
        }
    });
};

/**
 * Saves a record into the collection with given data.
 * @param collectionName The collection name.
 * @param obj Data for the record.
 * @param callback Callback for the query.
 */
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

/**
 * Updates a record in the collection with specified id and given data.
 * @param collectionName The name of the collection.
 * @param obj The updated data.
 * @param id The id of the record to update.
 * @param callback Callback for the query.
 */
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

/**
 * Deletes a record from the collection with given id.
 * @param collectionName The name of the collection.
 * @param id The id of the record
 * @param callback Callback for the query.
 */
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
