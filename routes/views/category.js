var keystone = require('keystone');

exports = module.exports = function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = req.params.category;
		locals.filters = {
		category: req.params.category,
	};
	locals.data = {
		sites: [],
		categories: []
	}

		// Load the current category filter
	view.on('init', function (next) {

		if (req.params.category) {
			keystone.list('SiteCategory').model.findOne({ slug: locals.filters.category }).exec(function (err, result) {
				locals.data.category = result;
				console.log(result)
				next(err);
			});
		} else {
			next();
		}
	});

	// Load all categories for navbar
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
		var q = keystone.list('Site').model.find()
		.populate('categories')
			if (locals.data.category) {
			q.where('categories').in([locals.data.category]);
		}
		q.exec(function (err, results) {
			locals.data.sites = results;
			next(err);
		})
	})

	view.render('category')
}