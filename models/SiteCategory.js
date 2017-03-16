var keystone = require('keystone');
var cloudinary = require('cloudinary');
var webshot = require('webshot');
var google = require('google');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');

var Types = keystone.Field.Types;

var SiteCategory = new keystone.List('SiteCategory', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'name', unique: true },
});

SiteCategory.add({
	name: { type: String, required: true, initial: true },
	categories: { type: String, dependsOn: { subcategory: false } },
	has_subcategories: { type: Types.Select, options: 'yes, no', default: 'no', initial: true, index: true  }
});

SiteCategory.relationship({ ref: 'Site', path: 'categories' });
SiteCategory.relationship({ ref: 'SiteCategory', path: 'categories' });

SiteCategory.schema.post('save', function(next) {
	var Site = keystone.list('Site').model;

	var self = this
	// See if sites exist in this category
	Site.find({
		'categories': self
	}, function(err, sites) {
		if (err) {
			console.log(err)
		}

		// populate the category
		if (sites === undefined || sites.length < 50) {
			google.resultsPerPage = sites ? 50 - sites.length : 50
			var nextCounter

			google(self.name + ' blog', function(err, res) {

				if (err) {
					console.log(err)
				}

				_.each(res.links, function(link) {
					setImmediate(function() {
						if (link.url || link.href && link.title) {

							var siteUrl = link.href || link.url

							var site = new Site({
								title: link.title,
								url: siteUrl,
								description: link.description,
								categories: self
							})

							var imgName = site._id + '.png'

							// For now save image to disk then delete after upload to cloudinary
							webshot(siteUrl, imgName, function (err) {
								if (err) {
									console.log(err)
								}

								cloudinary.uploader.upload(imgName, function (image) {
									site.image = image
									site.save(function(err) {
										if (err) {
											console.log(err)
											if(err.name == 'MongoError' && err.code == 11000) {

												// update image
												Site.findOneAndUpdate(
													{ url: siteUrl },
													{ image: image },
													function(err) {
														if (err) {
															console.log(err)
														}
													})
											}
										}

										// delete image
										fs.unlink(imgName, function(err) {
											if (err) {
												console.log(err)
												return
											}
										})
									})
								})
							})
						}
					})
				})

				if (nextCounter < 4) {
					nextCounter += 1
					if (res.next) {
						res.next()
					}
				}
			})
		} else {
			next()
		}
	})
})

SiteCategory.register();
