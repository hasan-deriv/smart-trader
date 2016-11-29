// TODO: to be remove after webpack finalized
var exportAllFunctions = function exportAllFunctions(obj) {
    for ( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) {
            window[key] = obj[key];
        }
    }
};

window.$ = window.jQuery = require('jquery');

require('./lib/jquery-ui-timepicker/jquery.ui.timepicker.js');
require('event-source-polyfill');
require('./lib/jQuery.XDomainRequest.js');
require('./lib/jquery-ui.js');
require('./lib/jquery.sparkline.js');
require('jquery.scrollto');

require('./binary/components/trackjs_onerror');
require('./binary/static_pages/static_pjax');
require('./binary/websocket_pages/websocket_pjax');

//needs refactoring
exportAllFunctions(require('./binary/base/page'));
exportAllFunctions(require('./binary/websocket_pages/socket'));

//adding onClick function in javascript, find a work around
exportAllFunctions(require('./binary/websocket_pages/mb_trade/mb_price'));
exportAllFunctions(require('./binary/websocket_pages/trade/process'));
exportAllFunctions(require('./binary/websocket_pages/trade/beta/process'));
