var current_guess = 1; // was 1

var current_row_state = 'uuuuu';  // Unknown
var current_tree_node = 0;
var tree_id = getParameterByName('tree');
const allowed_words_map = new Map();
const solution_words_map = new Map();
var remaining_solution_words_map = new Map();

// Keeps the list of remaining words.
var remaining_solution_words = new Array();

// Contains:
//  key: a possible response to a guess
//  value: an array of all (remaining valid) words with that response
const response_map = new Map();
var guess_response_map = new Map();

var valid_guess_word = false; // set to true when we have a word that can be guessed

// Number of remaining words to show;
var number_words_to_sample = 8;

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


// const reponse_map = new Map();
// Processes a word list to make a map of possible reponses.
// returns a Map that contains:
//  key: a possible response to a guess
//  value: an array of all (remaining valid) words with that response
function makeResponseMap(guess_word, word_list) {
  const all_responses_map = new Map();
  for (var ii = 0; ii< word_list.length; ++ii){
    // treat each word in the list as if it were the mystery word
    var response =  processWordPair(word_list[ii], guess_word);
    if(!all_responses_map.has(response)) {
      // add the response and the word
      all_responses_map.set(response, [word_list[ii]]);
    } else { // need to append the word to the set
      var word_list_for_reponse = all_responses_map.get(response);
      word_list_for_reponse.push(word_list[ii]);
      //all_responses_map.set(response, all_responses_map.get(response).push(word_list[ii]));
    }
  }
  return all_responses_map;
}

// Compares a guess word to a mystery word.
// The response is
// Compare two k-letter words (k hard-coded to be 5), determining an output
// response with a "-", "1", or "2" for each letter of the guess word, so that
// - at positions not in the mystery word
// 1 at positions where the guess and mystery word exactly match
// 2 if the guessed letter is elsewhere in the mystery word (and not yet
//   accounted for).
// Does not check case. Assumes both words are same case and same length
function processWordPair(mystery_word, guess_word) {
  var response = mystery_word;
  const mystery_letter_map = new Map();
  const guess_letter_map = new Map();
  // First, find the exact matches.
  for (var ii = 0; ii < mystery_word.length; ++ii){
    //console.log('ii: ' + ii + ' ' + mystery_word[ii] + ' ' + guess_word[ii]);
    if (mystery_word[ii] === guess_word[ii]) {
      //response[ii] = '1';
      response = response.substring(0, ii) + '1' + response.substring(ii + 1);
 //     console.log('match: ' + response);
    } else {
      //response[ii] = '-';
      response = response.substring(0, ii) + '-' + response.substring(ii + 1);
  //    console.log('nonmatch: ' + response);
      // Since the words differ, store a count of the letters in both guess
      // and mystery words.
      if (!mystery_letter_map.has(mystery_word[ii])) {
        mystery_letter_map.set(mystery_word[ii], 1);
//                console.log(' cnt value for mys: ' + mystery_word[ii] + ' is: ' + mystery_letter_map.get(mystery_word[ii]));

      } else {
        mystery_letter_map.set(mystery_word[ii], 1 + mystery_letter_map.get(mystery_word[ii]));
   //             console.log(' cnt value for mys: ' + mystery_word[ii] + ' is: ' + mystery_letter_map.get(mystery_word[ii]));
      }
      if (!guess_letter_map.has(guess_word[ii])) {
        guess_letter_map.set(guess_word[ii], 1);
      } else {
        guess_letter_map.set(guess_word[ii], guess_letter_map.get(guess_word[ii]));
      }
    }
  }
  // Now, we have a map of the letters in the guess word, and in the mystery
  // word that do not match in position.
  for (var ii = 0; ii <  guess_word.length; ++ii) {
    if (response[ii] === '-') { // Consider whether it might be a '2'
      if (mystery_letter_map.has(guess_word[ii]) && mystery_letter_map.get(guess_word[ii]) > 0) {
        // response[ii] = '2';
        response = response.substring(0, ii) + '2' + response.substring(ii + 1);
        mystery_letter_map.set(guess_word[ii], mystery_letter_map.get(guess_word[ii]) - 1);
  //      console.log(' new value for ' + guess_word[ii] + ' is: ' + mystery_letter_map.get(guess_word[ii]));
      }
    }
  }
  return response;
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
      // showHint('b');
      break;
    case 'p':
      //showHint('p');
      break;
    case 'ArrowLeft':
      showHint('ArrowLeft');
      break;
    case 'ArrowRight':
      showHint('ArrowRight');
      break;
    case 'Enter':
      //showHint('Enter');
      ProcessWordEntered();
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

// Gets the state of the current active row.
function GetRowState(row_index) {
  var row_state = '';
  for (var i = 0; i < 5; i++) {
    var id = 'b' + row_index + '\\.' + (i + 1);
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

// Opens up a row of tiles so that the user can click to change the state.
function OpenUpRowForClicking(row_index) {
  console.log('Need to open exact row' + row_index);
  // Any div with row+current_guess is changed to grid_zero
  $('.row' + row_index).toggleClass('grid_zero', true);
  $('.row' + row_index).data('status', '0')
}

function ComputeRemainingSolutionWords() {
    console.log("CRS " + current_row_state );
    $('#info-div-2').html('');
    var possible_response = guess_response_map.has(current_row_state);
    if (possible_response) {
      var words_left = guess_response_map.get(current_row_state);
      var num_words_left = words_left.length;
      console.log("there are: " + num_words_left + ' words left');
      $('#info-div-1').html("\nRemaining: " + num_words_left);

      //
      var some_words = '';
      var num_words_to_list = num_words_left;
      if (number_words_to_sample <num_words_to_list) {
        num_words_to_list = number_words_to_sample;
      }
      for (var ii = 0; ii< num_words_to_list; ++ii){
        console.log("R; " + words_left[ii]);
        some_words += words_left[ii] + '<br>\n';
      }
      $('#info-div-3').html(some_words);
      remaining_solution_words = words_left;

      // repopulate the map of (remaining) solutions
      remaining_solution_words_map.clear();
      for (var ii = 0; ii < remaining_solution_words.length; ++ii) {
        remaining_solution_words_map.set(remaining_solution_words[ii].toUpperCase(), 1);
      }
    } else {
      console.log("No solution words fit the clues.");
      $('#info-div-1').html("No remaining solution words.");
      $('#info-div-3').html('');
    }
}

function ProcessWordEntered() {
   console.log('Enter Process');
    // Is there any word that has been manually entered?

    let theText = guess.value;
    console.log('The entered text: ' + theText);
    if (!valid_guess_word) {
      return;
    }
    PushWordToRow(theText);

    // resets the word guess:
    valid_guess_word = false;
    $('#guess').css("color", "#B0B0B0");
    guess.value = ""; // "Enter Guess";

    LockInRowStates();

    // Update the active row index.
    current_guess = current_guess + 1;
    OpenUpRowForClicking(current_guess-1);
    GetRowState(current_guess-1);
      //GetRowState(current_guess-1);
    ComputeRemainingSolutionWords(); // see if this works
}

$(document).ready(function() {
  console.log('ready function');
  $(".grid-container-key" ).hide();
  $( "#guess" ).focus();

    // Handle key presses.
  $(document).keydown(onKeyDown);

  // Read the Word list
  var solution_word_url = 'solution_words.json';
  $.getJSON(solution_word_url).done(function(data_solutions) {
    solution_words = data_solutions.solution_words;
    remaining_solution_words = data_solutions.solution_words;
    console.log('Solution words loaded! Words: ' + solution_words.length);
    console.log('Solution word 0: ' + solution_words[0]);

    for (var ii = 0; ii < solution_words.length; ++ii) {
      solution_words_map.set(solution_words[ii].toUpperCase(), 1);
      //}
      //for (var ii = 0; ii < solution_words.length; ++ii) {
      remaining_solution_words_map.set(solution_words[ii].toUpperCase(), 1);
    }
  });


  // Read the Word list
  var allowed_word_url = 'allowed_words.json';
  $.getJSON(allowed_word_url).done(function(data_allowed) {
    allowed_words = data_allowed.allowed_words;
    console.log('Allowed words loaded! Words: ' + allowed_words.length);
    console.log('Allowed word 0: ' + allowed_words[0]);
    for (var ii = 0; ii < allowed_words.length; ++ii) {
      allowed_words_map.set(allowed_words[ii].toUpperCase(), 1);
    }

  });

  // Monitor the word as it's being entered
//  const guess_input = document.querySelector('guess');
//  guess_input.addEventListener('guess_input', updateValue);
//  function updateValue(e) {
//    console.log('Current guess:'+e.target_value)
//  }
  $('#guess').on('input', function() {
    console.log('out: '+guess.value);
    // if a five letter word, compare to the lists.
    if (guess.value.length==5){
      if (remaining_solution_words_map.get(guess.value.toUpperCase())===1) {
        valid_guess_word = true;
        $('#guess').css("color", "#20B060");
      } else if (allowed_words_map.get(guess.value.toUpperCase())===1 || solution_words_map.get(guess.value.toUpperCase())===1) {
        valid_guess_word = true;
        $('#guess').css("color", "#2060B0");
      } else {
        valid_guess_word = false;
        $('#guess').css("color", "#B04040");
      }
    } else {
      valid_guess_word = false;
      $('#guess').css("color", "#B0B0B0");
    }

    // Figure out how many different reponses there are to a valid word guess
    if (valid_guess_word) {
      LockInRowStates();
      var valid_responses = 18;
      // guess_response_map = makeResponseMap(guess.value.toLowerCase(), solution_words);
      guess_response_map = makeResponseMap(guess.value.toLowerCase(), remaining_solution_words);
      // $('#info-div-1').html("Remaining: " + solution_words.length + "\nResponses to: " + guess.value.toUpperCase() + " " + guess_response_map.size);
      // $('#info-div-1').html("Remaining: " + remaining_solution_words.length);
      $('#info-div-2').html("\nUnique responses: " + guess.value.toUpperCase() + " " + guess_response_map.size);
    }

  }).trigger('input');


  // This function changes the state of the box when clicked.
  $('.grid_item').click(function() {
    console.log('clicked box of ' + this.className);
    var changed_box = false;
    if (this.classList.contains('grid_zero')) {
      $(this).removeClass('grid_zero');
      $(this).addClass('grid_one');
      $(this).data('status', '1')
      changed_box = true;
    } else if (this.classList.contains('grid_one')) {
      $(this).removeClass('grid_one');
      $(this).addClass('grid_two');
      $(this).data('status', '2')
      changed_box = true;
    } else if (this.classList.contains('grid_two')) {
      $(this).removeClass('grid_two');
      $(this).addClass('grid_zero');
      $(this).data('status', '0')
      changed_box = true;
    }
    if (changed_box){
      GetRowState(current_guess-1);
      ComputeRemainingSolutionWords(); // when this is called, we update the remaining solutions list.
    }
  });

  // When enter is pressed, lock in the previous row's states, get the state of
  // the previous row, push a new word to the next row, and open up that row for
  // state changes. Checks if the game ends, either with success or with a typo
  // or error.
  $('.enter_key').click(function() {
    console.log('Enter Button');
    ProcessWordEntered();
  });
});
