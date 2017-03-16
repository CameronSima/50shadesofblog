var keystone = require('keystone');
var async = require('async');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

	locals.data = {
		categories: [],
		sites: []
	}

	view.on('init', function (next) {

		keystone.list('SiteCategory').model.find().sort('name')
		.exec(function(err, results) {
			if (err || !results.length) {
				return next(err);
			}
			locals.data.categories = results;
			next();
		})

	})

	view.on('init', function (next) {
		async.map(locals.data.categories, function(cat, callback) {
			keystone.list('Site').model.find({
				categories: cat._id
			})
			.populate('categories')
			.limit(3)
			.exec(function(err, result) {
				if (err) {
					console.log(err)
				}
				var obj = {};
				obj.category = cat;
				obj.sites = result;

				callback(null, obj)
			})
		}, function(err, results) {
			if (err) {
				return next(err)
			}
	
			locals.data.sites = results
			
			next()
		})
	})

	// Render the view
	view.render('index');
};
