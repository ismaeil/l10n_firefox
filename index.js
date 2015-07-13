// Import the self API.
var self = require("sdk/self");
// Import the page-mod API.
var pageMod = require("sdk/page-mod");
// Import the request API.
var Request = require("sdk/request").Request;

/**
 * Create a page mod.
 * It will run a script whenever our URL is loaded.
 */
pageMod.PageMod({
  //include: "https://localize.drupal.org/translate/languages/fr/translate*",
  include: "*",
  attachTo: ["top"],
  contentScriptFile: self.data.url("l10n.js"),
  contentStyleFile: self.data.url("l10n.css"),
  onAttach: function (worker) {
    // If we already parsed the json file (this happends every time we start
    // firefox session.
    if (typeof toSend !== 'undefined') {
      // Emit the terms to the content script.
      worker.port.emit('sendJson', toSend);
    } else {
      // Do a GET request to have the glossary terms.
      Request({
        url: "http://traduction.drupalfr.org/glossaire.json",
        onComplete: function (response) {
          // When the json glossary file is parsed, process terms and send them
          // to the content script.
          toSend = processJsonTerms(response.json.terms);
          worker.port.emit('sendJson', toSend);

        }
      }).get();
    }
  }
});

/**
 * Process glossary json terms to have an object of source strings as attributes
 * and their translation as values.
 *
 * Treat differently nouns and verbs for terms that are present in the glossary
 * Per example: "set (to)", the verb and "set", the noun.
 *
 *
 * @param glossaryterms {Array} array of glossary terms objects.
 * @returns {Object} Object of processed items.
 */
function processJsonTerms(glossaryterms) {
  // Initialize the returned object.
  var processedterms = {};
  for (var glossaryterm in glossaryterms) {
    // Have the sanitized term title.
    var rawterm = glossaryterms[glossaryterm].term.title;
    var sanitizedterm = sanitize(rawterm);
    var translatedterm = glossaryterms[glossaryterm].term.field_traduction;
    // Check if we already have the sanitized term in the returned object
    // This may be the case when we have a trem that corresponds to a name and
    // also to a verb in the glossary
    // Example : "set (to)" and "set"
    if (processedterms[sanitizedterm]) {
      // If the term ends with ' (to)' in our glossary terms, it is assumed to
      // be a verb.
      var isVerb = endsWith(rawterm, ' (to)');
      var verb = isVerb ? translatedterm : processedterms[sanitizedterm];
      var other = !isVerb ? translatedterm : processedterms[sanitizedterm];
      processedterms[sanitizedterm] =
              "<ul><li><strong>Verbe :</strong> " + verb +
              "</li><li><strong>Autre :</strong> " + other + "</li></ul>";
    }
    else {
      // If the term is found for the first time, just add its translation.
      processedterms[sanitizedterm] = translatedterm;
    }
  }
  return processedterms;
}


/**
 * Helper function to delete the ' (to)' suffix part in terms that are in our
 * glossary.
 * An example of this is teh term "filter aliases (to)".
 *
 * @param glossaryterm {String} a term from our json glossary.
 * @returns {String} term without the last ' (to)' part.
 */
function sanitize(glossaryterm) {
  // If the glossary term ends with ' (to)'.
  if (endsWith(glossaryterm, ' (to)')) {
    // Get the glossary terms without the ending ' (to)' part.
    glossaryterm = glossaryterm.substr(0, glossaryterm.indexOf(' (to)'));
  }
  return glossaryterm;
}

/**
 * Helper to know if a string ends with a given suffix.
 *
 * @param {String} str
 * @param {String} suffix
 * @returns {Boolean}
 */
function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}