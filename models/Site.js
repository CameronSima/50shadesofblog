var keystone = require('keystone');
var Types = keystone.Field.Types;

var Site = new keystone.List('Site', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true },
});

Site.add({
	title: { type: String, required: true },
	url: { type: Types.Url, required: true, initial: true, unique: true },
	image: { type: Types.CloudinaryImage },
	description: { type: String },
	categories: { type: Types.Relationship, ref: 'SiteCategory', many: true }
})

Site.register()