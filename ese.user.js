// ==UserScript==
// @name         Esa Search Extension
// @namespace    ese
// @version      0.7.0
// @description  Esa Search Extension makes advanced searching easy.
// @author       nalabjp
// @match        https://*.esa.io/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/keymaster/1.6.1/keymaster.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/vex-js/4.0.0/js/vex.combined.min.js
// @resource     vexCSS https://cdnjs.cloudflare.com/ajax/libs/vex-js/4.0.0/css/vex.min.css
// @resource     vexTheme https://cdnjs.cloudflare.com/ajax/libs/vex-js/4.0.0/css/vex-theme-default.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for vex
    const vexCss = GM_getResourceText('vexCSS');
    const vexTheme = GM_getResourceText('vexTheme');
    GM_addStyle(vexCss);
    GM_addStyle(vexTheme);
    vex.defaultOptions.className = 'vex-theme-default';

    // Utilities
    let replace_to_half_space = function(str) {
        // em space to half space
        return str.replace(/　/g, ' ');
    };

    let replace_to_only_colon = function(str) {
        return str.replace(/: +/g, ':');
    };

    // Add ESE element after form element
    let form = $('form.navbar-form.navbar-sub__navbar-form');
    let ese = $('<i class="fa fa-search-plus" aria-hidden="true id="ese" style="font-size: 24px; margin-top: 17px; margin-left: 10px; color: rgba(0, 0, 0, 0.2)"></i>');
    form.after(ese);

    // vex dialog
    let dialog = [
        '<style>',
            '.ese-form-container {',
                'margin-top: 20px;',
            '}',
            '.ese-form-block {',
                'margin-top: 5px;',
                'margin-bottom: 5px;',
            '}',
            '.ese-form-block input[type="radio"] {',
                'margin-left: 10px;',
                'margin-right: 10px;',
            '}',
            '.vex.vex-theme-default .vex-content .vex-dialog-message {',
                'font-weight: bold;',
                'font-size: 1.4em;',
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
        '<div class="ese-form-container">',
            '<div class="ese-form-block">',
                '<label>キーワード</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事名 or カテゴリ or 本文にkeywordを含むものを絞り込み"></i>' +
                '<input name="keyword" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>記事名</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事名にkeywordを含むものを絞り込み"></i>' +
                '<input name="title" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>記事本文</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事本文にkeywordを含むものを絞り込み"></i>' +
                '<input name="body" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>記事作成者</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事作成者のscreen_nameで絞り込み"></i>' +
                '<input name="user" type="text" placeholder="screen_name" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>Star</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="自分がStarしている記事で絞り込み"></i><br />' +
                '<input value="true" name="starred" type="radio" id="starred_true" /><label for="starred_true">true</label>' +
                '<input value="false" name="starred" type="radio" id="starred_false" /><label for="starred_false">false</label>' +
                '<input value="none" name="starred" type="radio" id="starred_none" /><label for="starred_none">none</label>',
            '</div>',
            '<div class="ese-form-block">',
                '<label>Watch</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="自分がWatchしている記事で絞り込み"></i><br />' +
                '<input value="true" name="watched" type="radio" id="watched_true" /><label for="watched_true">true</label>' +
                '<input value="false" name="watched" type="radio" id="watched_false" /><label for="watched_false">false</label>' +
                '<input value="none" name="watched" type="radio" id="watched_none" /><label for="watched_none">none</label>',
            '</div>',
            '<div class="ese-form-block">',
                '<label>WIP</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事のwip状態で絞り込み"></i><br />' +
                '<input value="true" name="wip" type="radio" id="wip_true" /><label for="wip_true">true</label>' +
                '<input value="false" name="wip" type="radio" id="wip_false" /><label for="wip_false">false</label>' +
                '<input value="none" name="wip" type="radio" id="wip_none" /><label for="wip_none">none</label>',
            '</div>',
            '<div class="ese-form-block">',
                '<label>種類</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事の種類で絞り込み"></i><br />' +
                '<input value="stock" name="kind" type="radio" id="kind_stock" /><label for="kind_stock">stock</label>' +
                '<input value="flow" name="kind" type="radio" id="kind_flow" /><label for="kind_flow">flow</label>' +
                '<input value="none" name="kind" type="radio" id="kind_both" /><label for="kind_both">both</label>',
            '</div>',
            '<div class="ese-form-block">',
                '<label>カテゴリ(部分一致)</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="カテゴリ名にkeywordを含むものを絞り込み"></i>' +
                '<input name="category" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>カテゴリ(前方一致)</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="カテゴリ名がkeywordから始まるものを絞り込み"></i>' +
                '<input name="in" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>カテゴリ(完全一致)</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="カテゴリ名がkeywordであるものを絞り込み"></i>' +
                '<input name="on" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>タグ</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="tagタグが付いているものを絞り込み"></i>' +
                '<input name="tag" type="text" placeholder="tag" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>コメント</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="コメント本文にkeywordが含まれる記事を絞り込み"></i>' +
                '<input name="comment" type="text" placeholder="keyword" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>Star数</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="Star数で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="stars" type="text" placeholder="number" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>Watch数</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="Watch数で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="watches" type="text" placeholder="number" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>コメント数</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="コメント数で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="comments" type="text" placeholder="number" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>作成日</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="作成日で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="created" type="text" placeholder="YYYY-MM-DD" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>更新日</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="更新日で記事を絞り込み（不等号[>, <, >=, <=]が使えます）"></i>' +
                '<input name="updated" type="text" placeholder="YYYY-MM-DD" />',
            '</div>',
            '<div class="ese-form-block">',
                '<label>外部公開</label>&nbsp;<i class="fa fa-question-circle" aria-hidden="true" data-toggle="tooltip" data-placement="right" data-title="記事の外部公開状態で絞り込み"></i><br />' +
                '<input value="true" name="sharing" type="radio" id="sharing_true" /><label for="sharing_true">true</label>' +
                '<input value="false" name="sharing" type="radio" id="sharing_false" /><label for="sharing_false">false</label>' +
                '<input value="none" name="sharing" type="radio" id="sharing_none" /><label for="sharing_none">none</label>',
            '</div>',
            '<input type="hidden" name="ese_form_save" id="ese_form_save" />',
        '</div>'
    ].join(' ');

    let build_condition = function(hash) {
        let conditions = [];
        Object.keys(hash).forEach(function(key) {
            let val = replace_to_half_space(this[key].trim());
            switch(key) {
                case 'wip':
                case 'kind':
                case 'starred':
                case 'watched':
                case 'sharing':
                    if (val === 'none') return;
                    conditions.push(key + ':' + val);
                    break;
                case 'keyword':
                    for(let v of val.split(' ').reverse()) {
                        conditions.unshift(v);
                    }
                    break;
                default:
                    for(let v of val.split(' ')) {
                        if (v.startsWith('-')) {
                            let k2 = v.substr(0, 1) + key;
                            let v2 = v.substr(1);
                            conditions.push(k2 + ':' + v2);
                        } else {
                            conditions.push(key + ':' + v);
                        }
                    }
            }
        }, hash);

        return conditions.join(' ');
    };

    // vex callback function
    let submitting = function (data) {
        if (!data) return console.log('Cancelled');

        $('#search_input').val(build_condition(data));
        form.submit();
    };

    // Bootstrap tooltip
    let enable_tooltip = function() {
        $('[data-toggle="tooltip"]').tooltip();
    };

    // Assign input values
    let assign_form_values = function(data) {
        let input_values = replace_to_only_colon(replace_to_half_space(data)).split(' ');
        let value_hash = {
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
        };

        for(let chunk of input_values) {
            if (chunk.includes(':')) {
                let kv = chunk.split(':', 2);
                switch(kv[0]) {
                    case 'wip':
                    case 'kind':
                    case 'starred':
                    case 'watched':
                    case 'sharing':
                        value_hash[kv[0]] = kv[1];
                        break;
                    default:
                        if (kv[0].startsWith('-')) {
                            let v = kv[0].substr(0, 1) + kv[1];
                            let k = kv[0].substr(1);
                            value_hash[k].push(v);
                        } else {
                            value_hash[kv[0]].push(kv[1]);
                        }
                }
            } else {
                value_hash.keyword.push(chunk);
            }
        }

        Object.keys(value_hash).forEach(function(key) {
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
                        $('.ese-form-container .ese-form-block input[name="' + key + '"]#' + key + '_' + val).prop('checked', true);
                    }
                    break;
                default:
                    if (val.length > 0) {
                        let e = $('.ese-form-container .ese-form-block input[name="' + key + '"]');
                        e.focus();
                        e.val(val.join(' ')).change();
                    }
            }
        }, value_hash);

        // Specific for keyword
        let e = $('.ese-form-container .ese-form-block input[name="keyword"]');
        e.blur();
        if (value_hash.keyword.length > 0) {
          e.val(value_hash.keyword.join(' ')).change();
        }
        e.focus();
    };

    // Clear all values in ese elements
    let clear_ese_form = function() {
        for(let e of $('.vex.vex-theme-default .vex-dialog-form .vex-dialog-input .ese-form-container .ese-form-block input')) {
            switch(e.type) {
                case 'text':
                    e.value = '';
                    break;
                case 'radio':
                    e.checked = false;
                    break;
            }
        }
        $('.ese-form-container .ese-form-block input[name="keyword"]').focus();
    };

    // Save current ese form
    // TODO: Should we use brwoserify for using 'form-serialize'?
    let before_save_values = function() {
        $('.vex.vex-theme-default .vex-dialog-form .vex-dialog-input .ese-form-container #ese_form_save').val('1');
    };
    let save_values = function(data) {
        GM_setValue('ese_form_data', build_condition(data));
    };

    // Load form data
    let load_values = function() {
        clear_ese_form();
        assign_form_values(GM_getValue('ese_form_data', ''));
    };

    // vex buttons
    let buttons = [
        $.extend({}, vex.dialog.buttons.YES, { className: 'btn btn-primary js-disable-on-uploading', text: 'Search' }),
        $.extend({}, vex.dialog.buttons.NO,  { className: 'btn btn-secondory', text: 'Clear', click: clear_ese_form }),
        $.extend({}, vex.dialog.buttons.YES, { className: 'btn btn-secondory', text: 'Save', click: before_save_values }),
        $.extend({}, vex.dialog.buttons.NO,  { className: 'btn btn-secondory', text: 'Load', click: load_values }),
    ];

    // For Save
    let before_close = function() {
        if (typeof this.value !== "undefined" && this.value.ese_form_save === '1') {
            $('.vex.vex-theme-default .vex-dialog-form .vex-dialog-input .ese-form-container #ese_form_save').val('');
            delete this.value.ese_form_save;
            save_values(this.value);
            return false;
        }
        return true;
    };

    // After open dialog callback
    let after_open = function() {
        // Enable after the element that configured Bootstrap tooltip defined
        enable_tooltip();

        assign_form_values($('#search_input').val());
    };

    let open_ese_dialog = function(){
        vex.dialog.open({
            message: 'Advanced Search',
            input: dialog,
            buttons: buttons,
            callback: submitting,
            afterOpen: after_open,
            beforeClose: before_close,
        });
    };

    let shortcut_ese_dialog = function() {
        open_ese_dialog();
        return false;
    };

    // Register click event
    ese.click(open_ese_dialog);
    // Register shortcut
    key('/', shortcut_ese_dialog);
})();
