var current_guess = 1;
var current_row_state = 'uuuuu';  // Unknown

/**
 * Get the value of a querystring item
 * @param {string} name name of the item
 * @param {string} url optioanl url, by default use window.location.herf
 * @return {string} value of item if found, {null} otherwise.
 */
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


function stopAndShowMessage(display_text) {
  $('.grid-container-key').stop(true, true).hide();
  $('.message').html(display_text);
  $('.grid-container-final').show();
}

function LockInRowStates() {
  $('.grid_zero').toggleClass('grid_zero zero_lock');
  $('.grid_one').toggleClass('grid_one one_lock');
  $('.grid_two').toggleClass('grid_two two_lock');
}

function showHint(hintText) {
  $('#hint').html(hintText).hide();
  $('#hint')
      .css({left: 100, top: 40})
      .show().delay(2000).fadeOut(1000);
}


function onKeyDown(event) {
  if (event.ctrlKey) return;

  var fired = true;

  switch (event.key) {
    case '>':
      showHint('>');
      break;
    case '<':
      showHint('<');
      break;
    case 'b':
      showHint('b');
      break;
    case 'p':
      showHint('p');
      break;
    case 'Enter':
      showHint('Enter');
      break;
    case 'ArrowLeft':
      showHint('ArrowLeft');
      break;
    case 'ArrowRight':
      showHint('ArrowRight');
      break;
    default:
      fired = false;
    break;
  }
}


// Gets the state of the current active row.
function GetRowState() {
  var row_state = '';
  for (var i = 0; i < 5; i++) {
    var id = 'b' + current_guess + '\\.' + (i + 1);
    console.log('classes of : ' + $('#' + id).text());
    console.log($('#' + id).attr('class'));
    if ($('#' + id).data('status') == '0') {
      row_state = row_state + '-';
    } else if ($('#' + id).data('status') == '1') {
      row_state = row_state + '1';
    } else if ($('#' + id).data('status') == '2') {
      row_state = row_state + '2';
    } else {
      row_state = row_state + 'u';
    }
  }
  current_row_state = row_state;
  console.log('Entered Status: ' + current_row_state);
}

// Finds the initial word guess from the word tree.
function GetFirstGuess() {
  console.log('Getting the first guess ' + current_tree_node);
  return word_tree[current_tree_node].guess;
}

// Displays the display_word on a row of tiles.
function PushWordToRow(display_word) {
  // Word must be 5 letters long
  console.log('Displaying word: ' + display_word);
  for (var i = 0; i < display_word.length; i++) {
    var char = display_word.charAt(i).toUpperCase();
    var id = 'b' + current_guess + '\\.' + (i + 1);
    $('#' + id).text(char);
  }
}

// Opens up a row of tiles so that the user can click to change the state.
function OpenUpRowForClicking() {
  console.log('Need to open row' + current_guess);
  // Any div with row+current_guess is changed to grid_zero
  $('.row' + current_guess).toggleClass('grid_zero', true);
  $('.row' + current_guess).data('status', '0')
}

$(document).ready(function() {
  console.log('ready function');
  // Handle key presses.
  $(document).keydown(onKeyDown);
  OpenUpRowForClicking();

  // Read the Word list 
  var solution_word_url = 'solution_words.json';
  $.getJSON(solution_word_url).done(function(data_solutions) {
    solution_words = data_solutions.solution_words;
    console.log('Solution words loaded! Words: ' + solution_words.length);
    console.log('Solution word 0: ' + solution_words[0]);
  });

  // Read the Word list 
  var allowed_word_url = 'allowed_words.json';
  $.getJSON(allowed_word_url).done(function(data_allowed) {
    allowed_words = data_allowed.allowed_words;
    console.log('Allowed words loaded! Words: ' + allowed_words.length);
    console.log('Allowed word 0: ' + allowed_words[0]);
  });

  // Monitor the word as it's being entered
//  const guess_input = document.querySelector('guess');
//  guess_input.addEventListener('guess_input', updateValue);
//  function updateValue(e) {
//    console.log('Current guess:'+e.target_value)
//  }
  $('#guess').on('input', function() {
    console.log('out: '+guess.value);
  }).trigger('input');



  // This function changes the state of the box when clicked.
  $('.grid_item').click(function() {
    console.log('clicked box of ' + this.className);
    if (this.classList.contains('grid_zero')) {
      $(this).removeClass('grid_zero');
      $(this).addClass('grid_one');
      $(this).data('status', '1')
    } else if (this.classList.contains('grid_one')) {
      $(this).removeClass('grid_one');
      $(this).addClass('grid_two');
      $(this).data('status', '2')
    } else if (this.classList.contains('grid_two')) {
      $(this).removeClass('grid_two');
      $(this).addClass('grid_zero');
      $(this).data('status', '0')
    }
  });
  $('.enter_key').click(function() {
    console.log('Enter Button');
    // Is there any word that has been manually entered?

    let theText = guess.value;
    console.log('The entered text: ' + theText);
    PushWordToRow(theText);
    guess.value = "Enter Guess";

    LockInRowStates();
    GetRowState();

    // If the puzzle is solved, then we can finish up. (We do not check for
    // consistency with previous answers).
    if (current_row_state == '11111') {
      stopAndShowMessage('Solved!');
      return;
    }

    // Get the next guess word
 //   var word_to_guess = GetNextWordGuessFromTree();
 //   if (word_to_guess == 0) {
 //     stopAndShowMessage(
 //         'The word is not in the vocabulary or there has been a typo!');
 //     return;
 //   }

    // Update the active row index.
    current_guess = current_guess + 1;

 //   PushWordToRow(word_to_guess);

    // Open Up Row
    OpenUpRowForClicking();
  });
});

