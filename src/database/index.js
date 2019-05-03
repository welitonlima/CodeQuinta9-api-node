const mongoose = require('mongoose');

mongoose.plugin(schema => { schema.options.usePushEach = true });

mongoose.connect('mongodb://localhost/noderest', { useMongoClient: true});
mongoose.Promise = global.Promise;

module.exports = mongoose;
