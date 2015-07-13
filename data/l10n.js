// Get the glossary terms.
self.port.on("sendJson", function (terms) {

  // Have the selector that contains english strings.
  var selector = 'tr td.source label.l10n-string span';
  // Query the english strings.
  var englishStrings = document.querySelectorAll(selector);
  // Loop on english strings.
  for (var i = 0; i < englishStrings.length; i++) {
    processEnglishStrings(terms, englishStrings[i]);
  }
});

/**
 * Process english strings to highlight those known in the glossary.
 */
function processEnglishStrings(terms, elem) {
  // Get the english string as an array.
  // This array will contain the known strings in glossary as object and other
  // parts as strings.
  // Example  [ "FlickrHood User Settings" ]
  // will be transformed to [ "FlickrHood User ", Object, "tings" ]
  // because 'set' is the only sub string that is known to glossary.
  var bits = [elem.innerHTML];

  // So now that we have an array of parts containing either string or already
  // processed objects, let's try to do a replacement on those strings.
  var refresh = false;
  do {
    refresh = false;
    // Add a javascript label to be able to break on it later.
    toRefresh : for (var index in bits) {
      // Process the bit if it has not been processed yet and if it's not an
      // empty string.
      if (!bits[index].processed && bits[index].length) {
        // initiatle found that will contain all found occurences of a glossary
        // term in the element.
        var found;
        for (term in terms) {
          // have a regex to search if a grossary term is part of the current
          // element string.
          var regexp = new RegExp('(' + term.replace(/\./g, "\\.") + ')', 'ig');
          if (found = bits[index].match(regexp)) {
            bits.splice(
                    index,
                    1,
                    // First element is a clean string or an empty one.
                    bits[index].indexOf(found[0]) > 0 ? bits[index].substr(0, bits[index].indexOf(found[0])) : '',
                    // Second element is a processed object to be replaced.
                            {processed: true, original: found[0], toBeReplacedWith: terms[term]},
                    // Third element is also a clean string
                    bits[index].substr(bits[index].indexOf(found[0]) + found[0].length)
                            );
                    // We have found something, mark this as to be done again from the beginning
                    refresh = true;
                    break toRefresh;
                  }
        }
      }
    }
  }
  // Repeat that until we do not find any term left.
  while (refresh);

  // Now we add our little tip on each term that have been porcessed
  for (var index in bits) {
    if (bits[index].processed) {
      if (bits[index].toBeReplacedWith) {
        // Adding the tipsy span on the terms
        bits[index] = '<span t="' + bits[index].toBeReplacedWith + '">' + bits[index].original + '</span>';
      }
      else {
        // Replacing with the original for the former l10n HTML
        bits[index] = bits[index].original;
      }
    }
  }

  // Bring the parts together to form a string.
  elem.innerHTML = bits.join("");
  var span = elem.querySelector('span[t]');

  if (span) {
    span.style.backgroundColor = 'yellow';
    span.style.cursor = 'pointer';

    span.onmouseover = function () {
      tooltip(this);
    };
    //console.log(span.getAttribute('t'));
    span.onclick = function () {
      // Have the selector that contains the new string to suggest.
      var selectortextarea = 'td.translation ul li.new-translation textarea';
      // Get the tr parent.
      var trparent = elem.parentNode.parentNode.parentNode;
      var newsuggestiontextarea = trparent.querySelector(selectortextarea);
      var glossarytermtranslation = this.getAttribute('t');

      if (newsuggestiontextarea.innerHTML === '&lt;New translation&gt;') {
        newsuggestiontextarea.innerHTML = '';
      }
      if (newsuggestiontextarea.innerHTML === '') {
        type(glossarytermtranslation, newsuggestiontextarea);
      }
      else {
        type(glossarytermtranslation, newsuggestiontextarea);
      }
      newsuggestiontextarea.focus();
      var event = document.createEvent('KeyboardEvent');

      event.initKeyboardEvent('keydown', true, true, window, false, false, false, false, 40, 0);

      document.dispatchEvent(event);

    };
  }

}

/**
 * Helper function to simulate typing.
 */
function type(string, element) {
  var existingstring = element.value;
  if (existingstring.trim() !== '') {
    string = existingstring + ' ' + string;
  }
  (function writer(i) {
    if (string.length <= i++) {
      element.value = string;
      return;
    }
    element.value = string.substring(0, i);
    if (element.value[element.value.length - 1] !== " ") {
      element.focus();
    }
    setTimeout(function () {
      writer(i);
    }, 10);
  })(0);
}

/**
 * Helper to display out tooltip.
 */
function tooltip(element) {
  // Delete title to not overlap with default browser behaviour.
  element.title = '';

  // Create a div to store output.
  var tooltip = document.createElement('div');
  tooltip.innerHTML = element.getAttribute('t');
  tooltip.id = 'l10n-firefox-tooltip';
  tooltip.style.display = 'none';
  tooltip.style.opacity = '0';
  tooltip.style.borderRadius = '10px';
  tooltip.style.padding = '5px';
  tooltip.style.filter = 'alpha(opacity=0)';
  document.body.appendChild(tooltip);

  // Mouse move.
  document.onmousemove = function (e) {
    x = e.pageX + 15;
    y = e.pageY + 15;
    // tooltip size.
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.display = 'block';
  };

  for (i = 0; i <= 100; i += 10) {
    var time = ((i / 20) * 30);
    setTimeout('opacity(' + i + ', \'l10n-firefox-tooltip\');', time);
  }


  // Mouse out.
  element.onmouseout = function () {
    for (i = 0; i <= 100; i += 1) {
      var time = ((i / 20) * 30);
      var opacity = (100 - i);
      setTimeout('opacity(' + opacity + ', \'l10n-firefox-tooltip\', 1);', time);
    }
  };

  // Handle opacity.
  opacity = function (opacity, id, close) {
    var tooltip = document.getElementById(id);
    tooltip.style.opacity = (opacity / 100);
    tooltip.style.filter = 'alpha(opacity=' + opacity + ')';
    if (opacity === 0 && close) {
      // Delete the temporary div.
      document.body.removeChild(tooltip);
      document.onmousemove = '';
    }
  };
}

