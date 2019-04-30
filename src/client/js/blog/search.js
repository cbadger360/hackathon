/*
 * Variables
 */
var contentAuthor = [];
var contentCategory = [];
var contentAuthorQuery = null;
var contentCategoryQuery = null;
var blogAuthorField = "custom_s_blog_author_243608";
var blogCategoryField = "custom_ss_blog_category_243575";
var blogContentField = "custom_s_main_content_237495";
/*
 * Templates
 */

// Content
var blogTemplate = '\
<div class="card">\
  <div class="card-img-top-container">\
    <a href="{custom_s_url}">\
      <img class="img-responsive" src="{custom_s_blog_featured_image_243716}" alt="{title}" title="{title}">\
    </a>\
  </div>\
  <div class="card-body">\
	<h5 class="card-title"><a href="{custom_s_url}">{title}</a></h5>\
	<p class="date">{custom_dt_last_updated}</p>\
	<p class="author">By: <a href="?a={custom_s_blog_author_243608}">{custom_s_blog_author_243608_label}</a></p>\
  <p class="card-text"><a href="{custom_s_url}">{custom_s_excerpt}</a></p>\
  </div>\
</div>';

// No Results
var blogNoResultsTemplate = '<p class="lead">There are currently no blog posts matching your search request.</p>';

// Searcher (Configuration)
function searchBlogsSearcher(s) {
	contentAuthorQuery = s.options.proxy + '?q=' + encodeURIComponent("https://searchg2-restricted.crownpeak.net/" + s.options.collection + "/select?q=*&facet=on&facet.field=" + blogAuthorField + "&echoParams=none&fl=id&defType=edismax&wt=json&start=0&rows=10&fq=!custom_b_hidefromsitesearch:true&facet.limit=9999");
	contentCategoryQuery = s.options.proxy + '?q=' + encodeURIComponent("https://searchg2-restricted.crownpeak.net/" + s.options.collection + "/select?q=*&facet=on&facet.field=" + blogCategoryField + "&echoParams=none&fl=id&defType=edismax&wt=json&start=0&rows=10&fq=!custom_b_hidefromsitesearch:true&facet.limit=9999");
	$.getJSON(contentAuthorQuery, function (data) {
		for (var i = 0; i < data.facet_counts.facet_fields[blogAuthorField].length; i = i + 2) {
			var item = data.facet_counts.facet_fields[blogAuthorField][i];
			contentAuthor.push({
				query: item,
				label: formatForDisplay(item)
			});
		}
		$.each(contentAuthor, function (i, type) {
			$('ul.authors').append($('<li />').append($('<label />').append([$('<input />').attr('type', 'checkbox').attr('value', type.query).attr('checked', isChecked('a', type.query)).on('change', function (e) {
				updateQuery();
			}), $('<span />').addClass('checkbox'), $('<span />').addClass('name').text(type.hasOwnProperty('label') ? type.label : type.query), $('<span />').addClass('count').attr('id', 'count-authors-' + formatForID(type.query))])));
		});
		$('ul.authors').prepend($('<li />').append($('<label />').append([$('<input />').attr('type', 'checkbox').attr('value', 'All').attr('checked', isChecked('a', 'All')).on('change', function (e) {
			if ($(this).is(':checked')) {
				$('ul.authors input').each(function () {
					$(this).prop('checked', true);
				});
			} else {
				$('ul.authors input').each(function () {
					$(this).prop('checked', false);
				});
			}
			updateQuery();
		}), $('<span />').addClass('checkbox'), $('<span />').addClass('name').text("All Authors")])));
	});
	$.getJSON(contentCategoryQuery, function (data) {
		for (var i = 0; i < data.facet_counts.facet_fields[blogCategoryField].length; i = i + 2) {
			var item = data.facet_counts.facet_fields[blogCategoryField][i];
			contentCategory.push({
				query: item,
				label: formatForDisplay(item)
			});
		}
		$.each(contentCategory, function (i, type) {
			$('ul.categories').append($('<li />').append($('<label />').append([$('<input />').attr('type', 'checkbox').attr('value', type.query).attr('checked', isChecked('c', type.query)).on('change', function () {
				updateQuery();
			}), $('<span />').addClass('checkbox'), $('<span />').addClass('name').text(type.hasOwnProperty('label') ? type.label : type.query), $('<span />').addClass('count').attr('id', 'count-content-type-' + formatForID(type.query))])));
		});
		$('ul.categories').prepend($('<li />').append($('<label />').append([$('<input />').attr('type', 'checkbox').attr('value', 'All').attr('checked', isChecked('c', 'All')).on('change', function () {
			if ($(this).is(':checked')) {
				$('ul.categories input').each(function () {
					$(this).prop('checked', true);
				});
			} else {
				$('ul.categories input').each(function () {
					$(this).prop('checked', false);
				});
			}
			updateQuery();
		}), $('<span />').addClass('checkbox'), $('<span />').addClass('name').text("All Categories")])));
	});
}

$('.filters-container .header i.fa-bars').on('click', function () {
	if ($('.filters-container .header').hasClass('expanded')) {
		$('.filters-container .header').removeClass('expanded');
		$('.filters-container .options').removeClass('expanded');
	} else {
		$('.filters-container .header').addClass('expanded');
		$('.filters-container .options').addClass('expanded');
	}
});

var urlParams = new URLSearchParams(window.location.search);

if (urlParams.has('q')) {
	$('#query').val(urlParams.get('q'));
	$('#queryMobile').val(urlParams.get('q'));
}
$('#queryMobile').on('keyup', function () {
	$('#query').val($('#queryMobile').val());
	updateQuery();
});
$('#query').on('keyup', function () {
	$('#queryMobile').val($('#query').val());
	updateQuery();
});

function isChecked(param, value) {
	var urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has(param)) {
		var values = urlParams.get(param).split(';');
		for (var i = 0; i < values.length; i++) {
			if (values[i] == value) {
				return 'checked';
			}
		}
	}
	return null;
}
var initialLoad = true;

function updateQuery() {
	//
	var a = [];
	var as = [];
	var bas = false;
	var c = [];
	var cs = [];
	var bcs = false;
	var solr = [];
	//
	var contentCategoryLimit = [];
	for (var i = 0; i < contentCategory.length; i++) {
		contentCategoryLimit.push('"' + contentCategory[i].query + '"');
	}
	var q = $('#query').val();
	var qq = [];
	if (q.length > 0) {
		qq.push('q=' + q);
		solr.push('(title:' + q + '* or ' + blogContentField + ':' + q + '*)');
	}
	// Categories
	$('ul.categories input:checked').each(function () {
		var value = $(this).attr('value');
		if (value != "All") {
			c.push(value);
			cs.push('"' + value + '"');
		} else {
			c.push(value);
			cs.push('"' + value + '"');
			bcs = true;
		}
	});
	if (initialLoad) {
		if (urlParams.has('c')) {
			var categories = urlParams.get('c').split(';');
			if (c.length == 0) {
				c = categories;
				for (var i = 0; i < c.length; i++) {
					cs.push('"' + formatForSolr(c[i]) + '"');
				}
			}
		}
	}
	if (c.length > 0) {
		qq.push('c=' + c.join(';'));
	}
	if (bcs) {
		cs = [];
	}
	// Authors
	$('ul.authors input:checked').each(function () {
		var value = $(this).attr('value');
		if (value != "All") {
			a.push(value);
			as.push('"' + value + '"');
		} else {
			bas = true;
		}
	});
	if (initialLoad) {
		if (urlParams.has('a')) {
			var authors = urlParams.get('a').split(';');
			if (a.length == 0) {
				a = authors;
				for (var i = 0; i < a.length; i++) {
					as.push('"' + formatForSolr(a[i]) + '"');
				}
			}
		}
	}
	if (bas) {
		as = [];
	}
	if (a.length > 0) {
		qq.push('a=' + a.join(';'));
	}
	if (cs.length > 0) {
		solr.push(blogCategoryField + ':(' + cs.join(',') + ')');
	}
	var sp = [];
	if (as.length > 0) {
		sp.push(blogAuthorField + ':(' + as.join(',') + ')');
	}
	if (sp.length > 0) {
		solr.push('(' + sp.join(' or ') + ')');
	}
	if (solr.length == 0) {
		triggerSearch('*');
	} else {
		triggerSearch(solr.join(' and '));
	}
	if (window.history.replaceState) {
		if (qq.length > 0) {
			var push = '?' + qq.join('&');
			window.history.replaceState(push, document.title, push);
		} else {
			window.history.replaceState('', document.title, '?');
		}
	}
	initialLoad = false;
}

function triggerSearch(value) {
	$('#q').val(value).trigger('change');
	$('.ih-search-again-wrap button').click();
}

function search_blogs_dataAvailable(s, d) {
	$('ul.categories span.count').text('');
	$('ul.authors span.count').text('');
	var authors = {};
	var categories = {};
	for (var i = 0; i < s.response.docs.length; i++) {
		var item = s.response.docs[i];
		// Date Format
		var month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		var date = new Date(item.custom_dt_last_updated);
		item.custom_dt_last_updated = month[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
		// Author Format
		item[blogAuthorField + "_label"] = formatForDisplay(item[blogAuthorField])
		if (typeof item[blogAuthorField] === "object") {
			if (typeof authors[item[blogAuthorField]] === "undefined") {
				authors[item[blogAuthorField]] = 1;
			} else {
				authors[item[blogAuthorField]] = authors[item[blogAuthorField]] + 1;
			}
		}
		if (typeof item[blogCategoryField] === "object") {
			for (var c = 0; c < item[blogCategoryField].length; c++) {
				var category = item[blogCategoryField][c];
				if (typeof categories[category] === "undefined") {
					categories[category] = 1;
				} else {
					categories[category] = categories[category] + 1;
				}
			}
		}
	}
	$.each(authors, function (author, count) {
		$('#count-authors-' + formatForID(author)).text('(' + count + ')');
	});
	$.each(categories, function (category, count) {
		$('#count-content-type-' + formatForID(category)).text('(' + count + ')');
	});
	if (s.response.docs.length > 0) {
		$('.ih-search-results').removeClass('no-results');
	} else {
		$('.ih-search-results').addClass('no-results');
	}
	return s;
};
if ($('#q').length == 0) {
	var qTimeout = setInterval(function () {
		if ($('#q').length == 1) {
			clearInterval(qTimeout);
			updateQuery();
		}
	}, 50);
}

function formatForDisplay(string) {
	return decodeURIComponent(string);
}

function formatForID(string) {
	return string.replace(/\s|\,/gi, '-').replace('--', '-').toLowerCase();
}

function formatForSolr(string) {
	string = encodeURIComponent(string);
	string = string.replace(/\%20/gi, ' ');
	console.log(string);
	return encodeURIComponent(string);
}