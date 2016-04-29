// Find the HTML element that included the tracing library (if there is one).
// This relies on the fact that scripts are executed as soon as they are
// included -- thus 'this' script is the last one in the array at the time
// this is run.
let hostScriptElement = (function () {
    let scripts = document.getElementsByTagName('SCRIPT');
    if (!(scripts.length > 0)) {
        return null;
    }
    return scripts[scripts.length - 1];
}());

function urlQueryParameters(defaults) {
    let vars = {};
    let qi = window.location.href.indexOf('?');
    if (qi < 0) {
        return vars;
    }
    let slice = window.location.href.slice(qi + 1);
    if (slice.indexOf('#') >= 0) {
        slice = slice.slice(0, slice.indexOf('#'));
    }
    let hashes = slice.replace(/\+/, '%20').split('&');
    for (let i = 0; i < hashes.length; i++) {
        let hash = hashes[i].split('=');
        vars[decodeURIComponent(hash[0])] = decodeURIComponent(hash[1]);
    }
    return vars;
}

// Parses options out of the host <script> element. Allows for easy configuration
// via the HTML element. Example:
//
// <script src='lightstep.min.js'
//      access_token='{my_access_token}'
//      group_name='my_group'></script>
//
// Note: relies on the global hostScriptElement variable defined above.
//
module.exports.parseScriptElementOptions = function (opts, browserOpts) {
    if (!hostScriptElement) {
        return;
    }

    let dataset = hostScriptElement.dataset;

    let accessToken = dataset.access_token;
    if (typeof accessToken === 'string' && accessToken.length > 0) {
        opts.access_token = accessToken;
    }

    // TODO: this should be only 'component_name'. A larger task to completely
    // replace group_name with component_name needs to be done.
    let groupName = dataset.component_name || dataset.group_name;
    if (typeof groupName === 'string' && groupName.length > 0) {
        opts.group_name = groupName;
    }

    let collectorHost = dataset.collector_host;
    if (typeof collectorHost === 'string' && collectorHost.length > 0) {
        opts.collector_host = collectorHost;
    }
    let collectorPort = dataset.collector_port;
    if (collectorPort) {
        opts.collector_port = parseInt(collectorPort, 10);
    }
    let collectorEncryption = dataset.collector_encryption;
    if (collectorEncryption) {
        opts.collector_encryption = collectorEncryption;
    }

    let enable = dataset.enable;
    if (typeof enable === 'string') {
        if (enable === 'true') {
            opts.enable = true;
        } else if (enable === 'false') {
            opts.enable = false;
        }
    }
    let debug = dataset.debug;
    if (typeof debug === 'string' && debug === 'true') {
        opts.debug = true;
    }
    let verbose = dataset.verbose;
    if (typeof verbose === 'string') {
        opts.verbose = parseInt(verbose, 10);
    }

    let init = dataset.init_global_tracer;
    if (typeof init === 'string') {
        if (init === 'true') {
            browserOpts.init_global_tracer = true;
        } else if (init === 'false') {
            browserOpts.init_global_tracer = false;
        }
    }

    // NOTE: this is a little inelegant as this is hard-coding support for a
    // "plug-in" option.
    let xhrInstrumentation = dataset.xhr_instrumentation;
    if (typeof xhrInstrumentation === 'string' && xhrInstrumentation === 'true') {
        browserOpts.xhr_instrumentation = true;
    }
};

// Parses options out of the current URL query string. The query parameters use
// the 'lightstep_' prefix to reduce the chance of collision with
// application-specific query parameters.
//
// This mechanism is particularly useful for debugging purposes as it does not
// require any code or configuration changes.
//
module.exports.parseURLQueryOptions = function (opts) {
    if (!window) {
        return;
    }

    let params = urlQueryParameters();
    if (params.lightstep_debug) {
        opts.debug = true;
    }
    if (params.lightstep_verbose) {
        try {
            opts.verbose = parseInt(params.lightstep_verbose, 10);
        } catch (_ignored) { /* Ignored */ }
    }
    if (params.lightstep_log_to_console) {
        opts.log_to_console = true;
    }
};
