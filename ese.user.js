// ==UserScript==
// @name         Esa Search Extension
// @namespace    ese
// @version      0.1
// @description  Esa Search Extension makes advanced searching easy.
// @author       nalabjp
// @match        https://*.esa.io/*
// @require      https://cdn.rawgit.com/HubSpot/vex/v4.0.0/dist/js/vex.combined.min.js
// @resource     vexCSS https://cdn.rawgit.com/HubSpot/vex/v4.0.0/dist/css/vex.css
// @resource     vexTheme https://cdn.rawgit.com/HubSpot/vex/v4.0.0/dist/css/vex-theme-default.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for vex
    const vexCss = GM_getResourceText('vexCSS');
    const vexTheme = GM_getResourceText('vexTheme');
    GM_addStyle(vexCss);
    GM_addStyle(vexTheme);
    vex.defaultOptions.className = 'vex-theme-default';

    // Add ESE element after form element
    var form = $('form.navbar-form.navbar-sub__navbar-form');
    var ese = $('<i class="fa fa-search-plus" aria-hidden="true id="ese" style="font-size: 24px; margin-top: 17px; margin-left: 10px; color: rgba(0, 0, 0, 0.2)"></i>');
    form.after(ese);

    // vex dialog
    var dialog = [
        '<div>',
            '<div>',
                'Keyword:' +
                '<input name="keyword" type="text" placeholder="Keyword" />',
            '</div>',
            '<div>',
                'Title:' +
                '<input name="title" type="text" placeholder="Title" />',
            '</div>',
            '<div>',
                'WIP:' +
                '<input value="true" name="wip" type="radio" id="wip_true" /><label for="wip_true">true</label>' +
                '<input value="false" name="wip" type="radio" id="wip_false" /><label for="wip_false">false</label>' +
                '<input value="none" name="wip" type="radio" id="wip_none" /><label for="wip_none">none</label>',
            '</div>',
            '<div>',
                'Kind:' +
                '<input value="stock" name="kind" type="radio" id="kind_stock" /><label for="kind_stock">stock</label>' +
                '<input value="flow" name="kind" type="radio" id="kind_flow" /><label for="kind_flow">flow</label>' +
                '<input value="none" name="kind" type="radio" id="kind_none" /><label for="kind_none">none</label>',
            '</div>',
            '<div>',
                'Category:' +
                '<input name="category" type="text" placeholder="Category" />',
            '</div>',
            '<div>',
                'In (Category):' +
                '<input name="in" type="text" placeholder="In (Category)" />',
            '</div>',
            '<div>',
                'On (Category):' +
                '<input name="on" type="text" placeholder="On (Category)" />',
            '</div>',
            '<div>',
                'Tag:' +
                '<input name="tag" type="text" placeholder="Tag" />',
            '</div>',
            '<div>',
                'Screen name:' +
                '<input name="user" type="text" placeholder="Screen name" />',
            '</div>',
            '<div>',
                'Comment:' +
                '<input name="comment" type="text" placeholder="Comment" />',
            '</div>',
            '<div>',
                'Stared:' +
                '<input value="true" name="stared" type="radio" id="stared_true" /><label for="stared_true">true</label>' +
                '<input value="false" name="stared" type="radio" id="stared_false" /><label for="stared_false">false</label>' +
                '<input value="none" name="stared" type="radio" id="stared_none" /><label for="stared_none">none</label>',
            '</div>',
            '<div>',
                'Watched:' +
                '<input value="true" name="watched" type="radio" id="watched_true" /><label for="watched_true">true</label>' +
                '<input value="false" name="watched" type="radio" id="watched_false" /><label for="watched_false">false</label>' +
                '<input value="none" name="watched" type="radio" id="watched_none" /><label for="watched_none">none</label>',
            '</div>',
            '<div>',
                'Stars:' +
                '<input name="stars" type="text" placeholder="Stars" />',
            '</div>',
            '<div>',
                'Watches:' +
                '<input name="watcheds" type="text" placeholder="Watches" />',
            '</div>',
            '<div>',
                'Comments:' +
                '<input name="comments" type="text" placeholder="Comments" />',
            '</div>',
            '<div>',
                'Created:' +
                '<input name="created" type="text" placeholder="Created" />',
            '</div>',
            '<div>',
                'Updated:' +
                '<input name="updated" type="text" placeholder="Updated" />',
            '</div>',
            '<div>',
                'Sharing:' +
                '<input value="true" name="sharing" type="radio" id="sharing_true" /><label for="sharing_true">true</label>' +
                '<input value="false" name="sharing" type="radio" id="sharing_false" /><label for="sharing_false">false</label>' +
                '<input value="none" name="sharing" type="radio" id="sharing_none" /><label for="sharing_none">none</label>',
            '</div>',
        '</div>'
    ].join(' ');

    // vex callback function
    var submitting = function (data) {
        if (!data) {
            console.log('Cancelled');
        } else {
            var conditions = [];
            Object.keys(data).forEach(function(key) {
                var val = this[key].trim();
                switch(key) {
                    case 'wip':
                    case 'kind':
                    case 'stared':
                    case 'watched':
                    case 'sharing':
                        if (val === 'none') return;
                        conditions.push(key + ':' + val);
                        break;
                    case 'keyword':
                        var words1 = val.split(' ').reverse();
                        for(var w1 of words1) {
                            conditions.unshift(w1);
                        }
                        break;
                    default:
                        var words2 = val.split(' ');
                        for(var w2 of words2) {
                            conditions.push(key + ':' + w2);
                        }
                }
            }, data);
            console.log(conditions);

            $('#search_input').val(conditions.join(' '));
            form.submit();
        }
    };

    // Register click event
    ese.click(function(){
        vex.dialog.open({
            message: 'Advanced Search',
            input: dialog,
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: 'Search' }),
                $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
            ],
            callback: submitting
        });
    });
})();
