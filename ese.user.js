// ==UserScript==
// @name         Esa Search Extension
// @namespace    ese
// @version      1.1.1
// @description  Esa Search Extension makes advanced searching easy.
// @author       nalabjp
// @match        https://*.esa.io/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/keymaster/1.6.1/keymaster.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/vex-js/4.0.0/js/vex.combined.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Caret.js/0.3.1/jquery.caret.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/at.js/1.5.4/js/jquery.atwho.min.js
// @resource     vexCSS https://cdnjs.cloudflare.com/ajax/libs/vex-js/4.0.0/css/vex.min.css
// @resource     vexTheme https://cdnjs.cloudflare.com/ajax/libs/vex-js/4.0.0/css/vex-theme-default.min.css
// @resource     atjsCSS https://cdnjs.cloudflare.com/ajax/libs/at.js/1.5.4/css/jquery.atwho.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    /*
     * Configuration for vex
     */

    const vexCss = GM_getResourceText('vexCSS');
    const vexTheme = GM_getResourceText('vexTheme');
    GM_addStyle(vexCss);
    GM_addStyle(vexTheme);
    vex.defaultOptions.className = 'vex-theme-default';

    /*
     * Configuration for At.js
     */

    const atjsCSS = GM_getResourceText('atjsCSS');
    GM_addStyle(atjsCSS);

    /*
     * Utilities
     */

    let replaceToHalfSpace = function(str) {
        // em space to half space
        return str.replace(/　/g, ' ');
    };

    let replaceToOnlyColon = function(str) {
        return str.replace(/: +/g, ':');
    };

    let loaded = {
        mentions: false,
        tags: false
    };

    let isExpired = function() {
        let expired_at = GM_getValue('ese_cache_expired_at', 0);
        if (expired_at === 0) return true;
        return Date.now() >= expired_at;
    };

    let setCacheExpiredAt = function() {
        let date = new Date();
        date.setMinutes(date.getMinutes() + 15);
        GM_setValue('ese_cache_expired_at', date.getTime());
    };

    let fetchSuggestion = function(name) {
        $.ajax({
            url: '/api/suggest/' + name,
            method: 'GET',
            success: function(resp) {
                console.log('fetch from api: [' + name + ']');
                GM_setValue('ese_cache_' + name, resp[name]);
                loaded[name] = true;
            }
        });
    };

    let loadSuggestions = function() {
        if (!isExpired()) {
            loaded.mentions = true;
            loaded.tags = true;
            return;
        }

        fetchSuggestion('mentions');
        fetchSuggestion('tags');
        setCacheExpiredAt();
    };
    loadSuggestions();

    /*
     * ese
     */

    // Add ese element after esa form
    let esaForm = $('form.navbar-form.navbar-sub__navbar-form');
    let eseIcon = $('<i class="fa fa-search-plus" aria-hidden="true id="ese" style="font-size: 24px; margin-top: 17px; margin-left: 10px; color: rgba(0, 0, 0, 0.2)"></i>');
    esaForm.after(eseIcon);

    // notication in nav
    let notify = function(text) {
        if (typeof text === 'undefined') return false;
        $('#ese-notification').text(text + ' (\\( ⁰⊖⁰)/)');
        setTimeout(function() { $('#ese-notification').text(''); }, 3000);
    };

    // build search word
    let buildSearchWord = function(valueHash) {
        let words = [];
        Object.keys(valueHash).forEach(function(key) {
            let val = replaceToHalfSpace(this[key].trim());
            switch(key) {
                case 'wip':
                case 'kind':
                case 'starred':
                case 'watched':
                case 'sharing':
                    if (val === 'none') return;
                    words.push(key + ':' + val);
                    break;
                case 'keyword':
                    for(let v of val.split(' ').reverse()) {
                        words.unshift(v);
                    }
                    break;
                case 'sort':
                    break;
                default:
                    for(let v of val.split(' ')) {
                        if (v.startsWith('-')) {
                            let k2 = v.substr(0, 1) + key;
                            let v2 = v.substr(1);
                            words.push(k2 + ':' + v2);
                        } else {
                            words.push(key + ':' + v);
                        }
                    }
            }
        }, valueHash);

        return words.join(' ');
    };

    let buildSortKey = function(valueHash) {
      if (typeof valueHash.sort === 'undefined') return '';
      return valueHash.sort.split('-')[0];
    };

    let buildSortOrder = function(valueHash) {
      if (typeof valueHash.sort === 'undefined') return '';
      return valueHash.sort.split('-')[1];
    };

    // Assign values to form
    let assignFormValues = function(searchWord) {
        let wordList = replaceToOnlyColon(replaceToHalfSpace(searchWord)).split(' ');
        let valueHash = {
            keyword: [],
            title: [],
            body: [],
            user: [],
            starred: '',
            watched: '',
            wip: '',
            kind: '',
            category: [],
            in: [],
            on: [],
            tag: [],
            comment: [],
            stars: [],
            watches: [],
            comments: [],
            created: [],
            updated: [],
            sharing: '',
            sort: '',
        };

        for(let chunk of wordList) {
            if (chunk.includes(':')) {
                let kv = chunk.split(':', 2);
                switch(kv[0]) {
                    case 'wip':
                    case 'kind':
                    case 'starred':
                    case 'watched':
                    case 'sharing':
                        valueHash[kv[0]] = kv[1];
                        break;
                    default:
                        if (kv[0].startsWith('-')) {
                            let v = kv[0].substr(0, 1) + kv[1];
                            let k = kv[0].substr(1);
                            valueHash[k].push(v);
                        } else {
                            valueHash[kv[0]].push(kv[1]);
                        }
                }
            } else {
                valueHash.keyword.push(chunk);
            }
        }

        Object.keys(valueHash).forEach(function(key) {
            let val = this[key];
            switch(key) {
                case 'keyword':
                    break;
                case 'wip':
                case 'kind':
                case 'starred':
                case 'watched':
                case 'sharing':
                    if (val !== '') {
                        $('.ese-container .ese-block input[name="' + key + '"]#' + key + '_' + val).prop('checked', true);
                    }
                    break;
                default:
                    if (val.length > 0) {
                        let e = $('.ese-container .ese-block input[name="' + key + '"]');
                        e.focus();
                        e.val(val.join(' ')).change();
                    }
            }
        }, valueHash);

        // Specific for keyword
        let e = $('.ese-container .ese-block input[name="keyword"]');
        e.blur();
        if (valueHash.keyword.length > 0) {
          e.val(valueHash.keyword.join(' ')).change();
        }
        e.focus();
    };

    let assignSortValues = function(sort_value) {
        $('.vex-dialog-buttons select[name="sort"]').val(sort_value);
    };

    // Clear all values in form
    let clearForm = function() {
        for(let e of $('.vex.vex-theme-default .vex-dialog-form .vex-dialog-input .ese-container .ese-block input')) {
            switch(e.type) {
                case 'text':
                    e.value = '';
                    break;
                case 'radio':
                    e.checked = false;
                    break;
            }
        }
        $('.ese-container .ese-block input[name="keyword"]').focus();
    };

    // Save current ese form
    // TODO: Should we use brwoserify for using 'form-serialize'?
    let beforeSaveValues = function() {
        $('.vex.vex-theme-default .vex-dialog-form .vex-dialog-input .ese-container #ese_before_save').val('1');
    };

    let saveValues = function(valueHash) {
        GM_setValue('ese_form_data', buildSearchWord(valueHash));
        notify('Save Form');
    };

    // Load form data
    let loadValues = function() {
        clearForm();
        assignFormValues(GM_getValue('ese_form_data', ''));
        notify('Load Form');
    };

    let bindSaveButton = function() {
        $('#ese-save-icon').click(function() {
            $('.ese-save-button').click();
        });
    };

    let bindLoadButton = function() {
        $('#ese-load-icon').click(function() {
            $('.ese-load-button').click();
        });
    };

    // Bootstrap tooltip
    let enableTooltip = function() {
        $('[data-toggle="tooltip"]').tooltip();
    };

    let enableMentionSuggestion = function() {
        $('.ese-container .ese-block input[name="user"]').atwho({
            at: '@',
            data: GM_getValue('ese_cache_mentions', {}),
            displayTpl: '<li><span class="thumbnail-circle"><img src="${icon}" class="thumbnail__image" /></span><span style="margin-left: 10px">${screen_name}</span></li>',
            insertTpl: '${screen_name}',
            searchKey: 'search_key',
            limit: 50
        });
    };

    let enableTagSuggestion = function() {
        $('.ese-container .ese-block input[name="tag"]').atwho({
            at: '#',
            data: GM_getValue('ese_cache_tags', []),
            insertTpl: '${name}',
            limit: 50
        });
    };

    /*
     * vex dialog options
     */

    // vex dialog messege
    let message = [
        '<span class="ese-title">Advanced Search</span>',
        '<span class="ese-nav">',
            '<span id="ese-notification"></span>',
            '<span id="ese-load-icon">',
                '<i class="fa fa-star-o ese-nav-icon" aria-hidden="true"></i>',
            '</span>',
            '<span id="ese-save-icon">',
                '<i class="fa fa-star ese-nav-icon" aria-hidden="true"></i>',
            '</span>',
        '</span>',
    ].join('');

    // vex dialog input
    let input = [
        '<style>',
            '.ese-title {',
                'font-weight: bold;',
                'font-size: 1.4em;',
            '}',
            '.ese-nav {',
                'float: right;',
            '}',
            '.ese-nav-icon {',
                'font-size: 1.4em;',
                'margin-left: 10px;',
            '}',
            '.ese-container {',
                'margin-top: 20px;',
            '}',
            '.ese-block {',
                'margin-top: 5px;',
                'margin-bottom: 5px;',
            '}',
            '.ese-block input[type="radio"] {',
                'margin-left: 10px;',
                'margin-right: 10px;',
            '}',
            '.form-control.ese-select {',
                'display: inline-block;',
                'width: auto;',
                'vertical-align: middle;',
            '}',
            '.ese-save-button, .ese-load-button {',
                'display: none;',
            '}',
            '.vex.vex-theme-default {',
                'padding-top: 60px;',
            '}',
            '.vex.vex-theme-default .vex-content {',
                'background: #efede0;',
                'width: 600px;',
            '}',
            '.vex.vex-theme-default .vex-dialog-form .vex-dialog-input {',
                'height: 600px;',
                'overflow-y: auto;',
            '}',
            '.vex.vex-theme-default .vex-dialog-form .vex-dialog-input input[type="text"]:focus {',
                'outline: none;',
                '-moz-box-shadow: inset 0 0 0 2px #0a9b94;',
                '-webkit-box-shadow: inset 0 0 0 2px #0a9b94;',
                'box-shadow: inset 0 0 0 2px #0a9b94;',
            '}',
        '</style>',
        '<div class="ese-container">',
            '<div class="ese-block">',
                '<label>キーワード</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事名 or カテゴリ or 本文にkeywordを含むものを絞り込み"></i>' +
                '<input name="keyword" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>記事名</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事名にkeywordを含むものを絞り込み"></i>' +
                '<input name="title" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>記事本文</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事本文にkeywordを含むものを絞り込み"></i>' +
                '<input name="body" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>記事作成者</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事作成者のscreen_nameで絞り込み（@で入力補完）"></i>' +
                '<input name="user" type="text" placeholder="screen_name" autocomplete="off" />',
            '</div>',
            '<div class="ese-block">',
                '<label>Star</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="自分がStarしている記事で絞り込み"></i><br />' +
                '<input value="true" name="starred" type="radio" id="starred_true" /><label for="starred_true">true</label>' +
                '<input value="false" name="starred" type="radio" id="starred_false" /><label for="starred_false">false</label>' +
                '<input value="none" name="starred" type="radio" id="starred_none" /><label for="starred_none">none</label>',
            '</div>',
            '<div class="ese-block">',
                '<label>Watch</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="自分がWatchしている記事で絞り込み"></i><br />' +
                '<input value="true" name="watched" type="radio" id="watched_true" /><label for="watched_true">true</label>' +
                '<input value="false" name="watched" type="radio" id="watched_false" /><label for="watched_false">false</label>' +
                '<input value="none" name="watched" type="radio" id="watched_none" /><label for="watched_none">none</label>',
            '</div>',
            '<div class="ese-block">',
                '<label>WIP</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事のwip状態で絞り込み"></i><br />' +
                '<input value="true" name="wip" type="radio" id="wip_true" /><label for="wip_true">true</label>' +
                '<input value="false" name="wip" type="radio" id="wip_false" /><label for="wip_false">false</label>' +
                '<input value="none" name="wip" type="radio" id="wip_none" /><label for="wip_none">none</label>',
            '</div>',
            '<div class="ese-block">',
                '<label>種類</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事の種類で絞り込み"></i><br />' +
                '<input value="stock" name="kind" type="radio" id="kind_stock" /><label for="kind_stock">stock</label>' +
                '<input value="flow" name="kind" type="radio" id="kind_flow" /><label for="kind_flow">flow</label>' +
                '<input value="none" name="kind" type="radio" id="kind_both" /><label for="kind_both">both</label>',
            '</div>',
            '<div class="ese-block">',
                '<label>カテゴリ(部分一致)</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="カテゴリ名にkeywordを含むものを絞り込み"></i>' +
                '<input name="category" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>カテゴリ(前方一致)</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="カテゴリ名がkeywordから始まるものを絞り込み"></i>' +
                '<input name="in" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>カテゴリ(完全一致)</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="カテゴリ名がkeywordであるものを絞り込み"></i>' +
                '<input name="on" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>タグ</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="tagタグが付いているものを絞り込み（#で入力補完）"></i>' +
                '<input name="tag" type="text" placeholder="tag" autocomplete="off" />',
            '</div>',
            '<div class="ese-block">',
                '<label>コメント</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="コメント本文にkeywordが含まれる記事を絞り込み"></i>' +
                '<input name="comment" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-block">',
                '<label>Star数</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="Star数で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="stars" type="text" placeholder="number" />',
            '</div>',
            '<div class="ese-block">',
                '<label>Watch数</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="Watch数で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="watches" type="text" placeholder="number" />',
            '</div>',
            '<div class="ese-block">',
                '<label>コメント数</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="コメント数で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="comments" type="text" placeholder="number" />',
            '</div>',
            '<div class="ese-block">',
                '<label>作成日</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="作成日で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="created" type="text" placeholder="YYYY-MM-DD" />',
            '</div>',
            '<div class="ese-block">',
                '<label>更新日</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="更新日で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="updated" type="text" placeholder="YYYY-MM-DD" />',
            '</div>',
            '<div class="ese-block">',
                '<label>外部公開</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事の外部公開状態で絞り込み"></i><br />' +
                '<input value="true" name="sharing" type="radio" id="sharing_true" /><label for="sharing_true">true</label>' +
                '<input value="false" name="sharing" type="radio" id="sharing_false" /><label for="sharing_false">false</label>' +
                '<input value="none" name="sharing" type="radio" id="sharing_none" /><label for="sharing_none">none</label>',
            '</div>',
            '<input type="hidden" name="ese_before_save" id="ese_before_save" />',
        '</div>'
    ].join('');

    // vex buttons
    let buttons = [
        $.extend({}, vex.dialog.buttons.YES, { className: 'btn btn-primary js-disable-on-uploading', text: 'Search' }),
        $.extend({}, vex.dialog.buttons.NO,  { className: 'btn btn-secondory', text: 'Clear', click: clearForm }),
        $.extend({}, vex.dialog.buttons.YES, { className: 'btn btn-secondory ese-save-button', text: 'Save', click: beforeSaveValues }),
        $.extend({}, vex.dialog.buttons.NO,  { className: 'btn btn-secondory ese-load-button', text: 'Load', click: loadValues }),
    ];

    // sort select box
    let sort_select = '<select class="form-control ese-select input-sm" name="sort">' +
                          '<option selected="selected" value="">Best match</option>' +
                          '<option value="created-desc">Newest</option>' +
                          '<option value="created-asc">Oldest</option>' +
                          '<option value="updated-desc">Recently updated</option>' +
                          '<option value="updated-asc">Least recently updated</option>' +
                          '<option value="stars-desc">Most starred</option>' +
                          '<option value="watches-desc">Most watched</option>' +
                          '<option value="comments-desc">Most commented</option>' +
                      '</select>';
    let addSortSelect = function() {
        $('.vex-dialog-buttons').prepend(sort_select);
        assignSortValues($('#search_sort').val());
    };

    // vex dialog callback
    let callback = function (valueHash) {
        if (!valueHash) return console.log('Cancelled');
        $('#search_input').val(buildSearchWord(valueHash));
        $('#search_input_sort').val(buildSortKey(valueHash));
        $('#search_input_order').val(buildSortOrder(valueHash));
        console.log(esaForm);
        esaForm.submit();
    };

    // vex dialog afterOpen
    let afterOpen = function() {
        // Enable after the element that configured Bootstrap tooltip defined
        enableTooltip();

        bindSaveButton();
        bindLoadButton();

        assignFormValues($('#search_input').val());

        let mentionTimer = setInterval(function(){
            if (loaded.mentions === true) {
                clearInterval(mentionTimer);
                enableMentionSuggestion();
            }
        }, 1000);

        let tagTimer = setInterval(function(){
            if (loaded.tags === true) {
                clearInterval(mentionTimer);
                enableTagSuggestion();
            }
        }, 1000);
    };

    // vex dialog beforeClose
    let beforeClose = function() {
        if (typeof this.value !== "undefined" && this.value.ese_before_save === '1') {
            $('.vex.vex-theme-default .vex-dialog-form .vex-dialog-input .ese-container #ese_before_save').val('');
            delete this.value.ese_before_save;
            saveValues(this.value);
            delete this.value;
            return false;
        }
        return true;
    };

    let openEse = function(){
        vex.dialog.open({
            unsafeMessage: message,
            input: input,
            buttons: buttons,
            callback: callback,
            afterOpen: afterOpen,
            beforeClose: beforeClose,
        });

        addSortSelect();

        $('.ese-container .ese-block input[name="keyword"]').focus();
    };

    let shortcutEse = function() {
        openEse();
        return false;
    };

    // Register click event
    eseIcon.click(openEse);
    // Register shortcut
    key('/', shortcutEse);
})();
