// import axios from 'axios';
import Blackjack from './blackjack.js';

export function renderBlackjack() {
    const game = newGame();
    const $page = $('#page');
    $page.on("click", "#submit_initial_bet_button", (event) => placeInitialBet(game));
    $page.on("click", "#yes_insurance_button", (event) => handleYesNoPress(event, game));
    $page.on("click", "#no_insurance_button", (event) => handleYesNoPress(event, game));
    $page.on("click", "#split_button", (event) => handleSplit(game));
    $page.on("click", "#hit_button", (event) => handleHit(game));
    $page.on("click", "#stand_button", (event) => handleStand(game));
    $page.on("click", "#play_again_button", (event) => playAgain(game));
    $page.on("click", "#double_down_button", (event) => handleDD(game));
}

export function newGame() {
    let game = new Blackjack();
    game.clearGame();
    const $root = $('#root');

    //clear page if anything remains
    $('#game').remove();
    $root.empty();

    //add blackjack header and button box and set place for game
    const header =
        `<div class="header">
            <h1>Blackjack</h1>
            <h2 id="tokens"></h2>
        </div>
        <div class="message_box">
            <h2 class="message">Place your bet. Minimum is 5. Maximum is 50.</h2>
            <div class="play_buttons">
                <div class="input_bet">
                    <input type="number" id="initial_bet_input" min="5" max="50" value="5">
                    <button type="submit" id="submit_initial_bet_button">Place Bet</button>
                </div>
            </div>
        </div>
        <div id="game"></div>`;

    $root.append(header);
    return game;
}

export async function placeInitialBet(game) {
    let bet;
    //pull value from input
    const initial_bet = parseInt($('#initial_bet_input').val());
    //if no value in input, default to five, else value is assinged to bet
    if (initial_bet === NaN) {
        bet = 5;
    } else {
        bet = initial_bet;
    }
    //remove betting input & button
    $('.input_bet').remove();
    //load the game
    loadBlackjack(game, bet);
}

export async function loadBlackjack(game, bet) {
    const $game = $('#game');
    //get a new deck, shuffle it and draw 4 cards
    const deck = await axios({
        method: 'get',
        url: 'https://deckofcardsapi.com/api/deck/new/draw/?count=4'
    });
    //if request was failed, post error message and stop code
    if (!deck.data['success']) {
        errorMessage();
        return;
    }
    //set deck id in class
    game.deck_id = deck.data['deck_id'];
    // deal out cards
    game.player.cards.push(deck.data['cards'][0], deck.data['cards'][2]);
    game.dealer.cards.push(deck.data['cards'][1], deck.data['cards'][3]);
    // const cards =  [
    //     {
    //         "image": "https://deckofcardsapi.com/static/img/KH.png",
    //         "value": "KING",
    //         "suit": "HEARTS",
    //         "code": "KH"
    //     },
    //     {
    //         "image": "https://deckofcardsapi.com/static/img/8C.png",
    //         "value": "8",
    //         "suit": "CLUBS",
    //         "code": "8C"
    //     },
    //     {
    //         "image": "https://deckofcardsapi.com/static/img/KS.png",
    //         "value": "KING",
    //         "suit": "SPADES",
    //         "code": "KS"
    //     },
    //     {
    //         "image": "https://deckofcardsapi.com/static/img/AH.png",
    //         "value": "ACE",
    //         "suit": "HEARTS",
    //         "code": "AH"
    //     }
    // ]
    // game.player.cards.push(cards[0], cards[2]);
    // game.dealer.cards.push(cards[1], cards[3]);
    //set initial bet & total bet
    game.player.bets.initial = bet;
    game.player.bets.total = bet;
    //set player and dealer scores
    game.setPlayerScore();
    game.setDealerScore();
    //add player cards and bets
    const player =
        `<div class="player">
            <h2 id="player_name">Player</h2>
            <div class="player_bets">
                <h4 id="total_bet">Total Bet: ${bet}</h4>
                <h5 id="initial_bet">Initial Bet: ${bet}</h5>
                <h5 id="insurance_bet"></h5>
                <h5 id="double_down_bet"></h5>
                <h5 id="split_bet"></h5>
            </div>
            <div class="cards" id="player_cards">
                <h2 id="player_score">Score: ${game.player.score}</h2>
                <img src=${game.player.cards[0].image} alt="${game.player.cards[0].value}">
                <img src=${game.player.cards[1].image} alt="${game.player.cards[1].value}">
            </div>
        </div>`;
    $game.append(player);
    //add dealer cards and bets
    const dealer =
        `<div class="dealer">
            <h2>Dealer</h2>
            <div class="cards" id="dealer_cards">
                <h2 id="dealer_score"></h2>
                <img id="face_down_card" src="card.jpg" alt="face down card">
                <img src=${game.dealer.cards[1].image} alt="${game.dealer.cards[1].value}">
            </div>
        </div>`
    $game.append(dealer);
    //if dealer is showing ace, give option for insurance
    if (game.dealer.cards[1].value === "ACE") {
        //take insurance route
        insuranceBet(game);
    } else {
        //take normal route
        addPlayOptionButtons(game.player.cards[0], game.player.cards[1]);
    }
}

export function insuranceBet(game) {
    //update message
    $('.message').text("Dealer is showing an ace. Would you like to place an insurance bet? Maximum bet is half your initial bet.");
    //add insurance options
    // console.log(game);
    const max = game.player.bets.initial/2
    const insurance =
        `<div class="insurance">
            <input id="insurance_bet_input" type="number" min=1 max=${max} value=${max}>
            <button id="yes_insurance_button">Yes</button>
            <button id="no_insurance_button">No</button>
        </div>`
    $('.play_buttons').append(insurance);
}

export function handleYesNoPress(event, game) {
    //grab id of button pressed
    const id = event.target.id;
    //if yes, save bet & update bets
    if (id === "yes_insurance_button") {
        const insurance_bet = parseInt($('#insurance_bet_input').val());
        game.player.bets.insurance = insurance_bet;
        game.player.bets.total = game.player.bets.total + game.player.bets.insurance;
        $('#total_bet').text("Total Bet: " + game.player.bets.total);
        $('#insurance_bet').text("Insurance Bet: " + insurance_bet);
    }
    //remove insurance info
    $('.insurance').remove();
    //check if dealer won
    if (game.dealer.score === 21) {
        $('#face_down_card').replaceWith(`<img src=${game.dealer.cards[0].image} alt="${game.dealer.cards[0].value}">`);
        $('#dealer_score').text("Score: " + game.dealer.score);
        gameOver(game);
        return;
    } else {
        //continue on normal route
        addPlayOptionButtons(game.player.cards[0], game.player.cards[1], true);
    }
}

export function addPlayOptionButtons(card1, card2, bool) {
    if (!bool) {
        //add normal button options
        $('.message').text("Do you want to hit, stand or double down?");
        $('.play_buttons').replaceWith(
            `<div class=play_buttons>
                <button id=hit_button>Hit</button>
                <button id=stand_button>Stand</button>
                <button id=double_down_button>Double Down</button>
            </div>`
        )
        //if cards are the same, add option to split
        if (card1.value === card2.value) {
            $('.message').text("Do you want to hit, stand, double down or split?");
            $('.play_buttons').append(`<button id=split_button>Split</button>`)
        }
    } else {
        //add normal button options
        $('.message').text("Dealer did not have Blackjack. Do you want to hit, stand or double down?");
        $('.play_buttons').replaceWith(
            `<div class=play_buttons>
                <button id=hit_button>Hit</button>
                <button id=stand_button>Stand</button>
                <button id=double_down_button>Double Down</button>
            </div>`
        )
        //if cards are the same, add option to split
        if (card1.value === card2.value) {
            $('.message').text("Dealer did not have Blackjack. Do you want to hit, stand, double down or split?");
            $('.play_buttons').append(`<button id=split_button>Split</button>`)
        }
    }
}

export async function handleSplit(game) {
    //pull deck id to create url for API request
    const deck_id = game.deck_id;
    const url = 'https://deckofcardsapi.com/api/deck/' + deck_id + '/draw/?count=2'
    //draw 2 new cards
    const draw = await axios({
        method: 'get',
        url: url
    });
    //if not successful, show error and stop code
    if (!draw.data['success']) {
        errorMessage();
        return;
    }
    //if hand hasn't been split yet
    if (!game.player.been_split) {
        //create card array for each new hand
        const s1 = [game.player.cards[0], draw.data['cards'][0]];
        const s2 = [game.player.cards[1], draw.data['cards'][1]];
        //add both hands to split array
        game.player.split.cards.push(s1, s2);
        //set scores
        game.setSplitScore(0);
        game.setSplitScore(1);
        //set split to be true
        game.player.been_split = true;
        //update split bet and total in player
        game.player.bets.split += game.player.bets.initial;
        game.player.bets.total += game.player.bets.initial;
        //load new hands
        loadSplitCards(game);
    } else {
        //this is the hand currently being played, aka the index of split cards array needing attention
        const index = game.player.split.pointer;
        //create card array for each new hand
        const s1 = [game.player.split.cards[index][0], draw.data['cards'][0]];
        const s2 = [game.player.split.cards[index][1], draw.data['cards'][0]];
        //replace hand at index with s1 and add s2 behind it
        game.player.split.cards.splice(index, 1, s1);
        game.player.split.cards.splice(index + 1, 0, s2);
        //calculate new scores
        const score_1 = game.calculateSplitScore(index);
        const score_2 = game.calculateSplitScore(index+1);
        //set new scores
        game.player.split.scores.splice(index, 1, score_1);
        game.player.split.scores.splice(index + 1, 0, score_2);
        //update split bet and total in player
        game.player.bets.split += game.player.bets.initial;
        game.player.bets.total += game.player.bets.initial;
        loadSplitCards(game);
    }
}

export function loadSplitCards(game) {
    console.log("loading split cards");
    //empty out player cards
    $('#player_cards').empty();
    //set split bet
    $('#split_bet').text("Split Bet: " + game.player.bets.split);
    $('#total_bet').text("Total Bet: " + game.player.bets.total);
    //iterate through all split cards
    let cards = ``;
    let split = game.player.split.cards;
    for (let i = 0; i < split.length; i++) {
        //if hand has already been played, load the cards for it
        if (i < game.player.split.pointer) {
            const id = "#hand_" + i+1 + "";
            cards += $(id);
        } else {
            //if hand hasn't been played, load the cards for it
            const card = 
            `<div id="hand_${i+1}">
                <h2>Hand ${i+1}</h2>
                <h2 id="score_${i+1}">Score: ${game.player.split.scores[i]}</h2>
                <img src=${split[i][0].image} alt="${split[i][0].value}">
                <img src=${split[i][1].image} alt="${split[i][1].value}">
            </div>`
            cards += card;
        }
    }
    //add split hands to DOM
    $('#player_cards').append(cards);
    //find pointer to next set of cards to be played
    const pointer = game.player.split.pointer;
    //set hand pointer is at to class=active
    const id = "#hand_" + (pointer+1) + ""
    $(id).attr("class", "pointer");
    //add play option buttons
    addPlayOptionButtons(game.player.split.cards[pointer][0], game.player.split.cards[pointer][1]);
}

export async function handleHit(game) {
    console.log("handling hit")
    //remove double down button, no longer an option for this hand
    $('#double_down_button').remove();
    //pull deck id to create url for API request
    const deck_id = game.deck_id;
    const url = 'https://deckofcardsapi.com/api/deck/' + deck_id + '/draw/?count=1'
    //draw 1 new card
    const draw = await axios({
        method: 'get',
        url: url
    });
    //if not successful, show error and stop code
    if (!draw.data['success']) {
        errorMessage();
        return;
    }
    //if hand hasn't been split
    if (!game.player.been_split) {
        //add card to cards
        game.player.cards.push(draw.data['cards'][0]);
        //update score
        game.setPlayerScore();
        $('#player_score').text("Score: " + game.player.score);
        //add card to DOM
        const length = game.player.cards.length;
        $('#player_cards').append(`<img src=${game.player.cards[length-1].image} alt="${game.player.cards[length-1].value}">`)
        //if player busts or has 21
        if (game.player.score >= 21 && !game.player.double_down) {
            //player's turn ends
            dealerPlay(game);
        } else if (game.player.double_down) {
            handleStand(game);
        } else {
            $('.message').text("Hit or stand.");
        }
    } else {
        //get pointer
        const index = game.player.split.pointer;
        //add card to split hand pointer is at
        game.player.split.cards[index].push(draw.data['cards'][0]);
        //update score at pointer
        game.setSplitScore(index);
        const id = "#score_" + (index+1) + "";
        $(id).text("Score: " + game.player.split.scores[index]);
        //add card to DOM
        const ref = "#hand_" + (index+1) + "";
        const length = game.player.split.cards.length;
        $(ref).append(`<img src=${game.player.split.cards[index][length-1].image} alt="${game.player.split.cards[index][length-1].value}">`);
        console.log("score: " + game.player.split.scores[index]);
        console.log("double down? " + game.player.split.double_down[index]);
        //if hand busts or has 21
        if (game.player.split.scores[index] >= 21 && !game.player.split.double_down[index]) {
            console.log("checkpoint 1")
            //remove pointer class from current card at pointer
            const id_1 = "#hand_" + (game.player.split.pointer+1) + "";
            $(id_1).removeAttr("class", "pointer");
            //if last hand in split cards
            if (length === index+1) {
                //end of player's turn
                dealerPlay(game)
            } else {
                //change pointer to next hand in split cards
                game.player.split.pointer++;
                //add pointer class to card at new pointer
                const index = game.player.split.pointer;
                const id_2 = "#hand_" + (index+1) + ""
                $(id_2).attr("class", "pointer");
            }
        } else if (game.player.split.double_down[index]) {
            console.log("checkpoint 2")
            handleStand(game);
        } else {
            console.log("checkpoint 3")
            $('.message').text("Hit or stand.");
        }

    }
}

export async function handleStand(game) {
    console.log("handing stand");
    //if hand hasn't been split, dealer's turn
    if (!game.player.been_split) {
        dealerPlay(game);
    //if last split hand to be played
    } else if (game.player.split.cards.length === game.player.split.pointer + 1) {
        //remove pointer class from current card at pointer
        const id_1 = "#hand_" + (game.player.split.pointer+1) + "";
        $(id_1).removeAttr("class", "pointer");
        //end of player's turn
        dealerPlay(game)
    //change pointer to next hand in split cards
    } else {
        //remove pointer class from current card at pointer
        const id_1 = "#hand_" + (game.player.split.pointer+1) + "";
        $(id_1).removeAttr("class", "pointer");
        //increment pointer
        game.player.split.pointer++;
        //add pointer class to card at new pointer
        const index = game.player.split.pointer;
        const id_2 = "#hand_" + (index+1) + ""
        $(id_2).attr("class", "pointer");
        //load play option buttons with new pointer
        addPlayOptionButtons(game.player.split.cards[index][0], game.player.split.cards[index][1]);
    }
}

export function handleDD(game) {
    //if no split hands
    if (!game.player.been_split) {
        game.player.double_down = true;
        //update betting
        game.player.bets.double_down += game.player.bets.initial;
        game.player.bets.total += game.player.bets.initial;
        $('#total_bet').text("Total Bet: " + game.player.bets.total);
        $('#double_down_bet').text("Double Down Bet: " + game.player.bets.double_down);
        //double down
        handleHit(game);
        // handleStand(game);
        // dealerPlay(game);
    } else {
        const pointer = game.player.split.pointer;
        game.player.split.double_down[pointer] = true;
        //update betting
        game.player.bets.double_down += game.player.bets.initial;
        game.player.bets.total += game.player.bets.initial;
        $('#total_bet').text("Total Bet: " + game.player.bets.total);
        $('#double_down_bet').text("Double Down Bet: " + game.player.bets.double_down);
        //double down
        handleHit(game);
        // handleStand(game);
    }
}

export async function dealerPlay(game) {
    console.log("dealer playing")
    $('#face_down_card').replaceWith(`<img src=${game.dealer.cards[0].image} alt="${game.dealer.cards[0].value}"></img>`);
    $('#dealer_score').text("Score: " + game.dealer.score);
    if (game.dealer.score < 17) {
        dealerDraw(game);
    } else {
        gameOver(game);
    }
}

export async function dealerDraw(game) {
    console.log("dealer drawing")
    //pull deck id to create url for API request
    const deck_id = game.deck_id;
    const url = 'https://deckofcardsapi.com/api/deck/' + deck_id + '/draw/?count=1'
    //draw 1 new card
    const draw = await axios({
        method: 'get',
        url: url
    });
    //if not successful, show error and stop code
    if (!draw.data['success']) {
        errorMessage();
        return;
    }
    //add new card to dealer cards
    game.dealer.cards.push(draw.data['cards'][0]);
    //update score
    game.setDealerScore();
    $('#dealer_score').text("Score: " + game.dealer.score);
    //add card to DOM
    const length = game.dealer.cards.length;
    $('#dealer_cards').append(`<img src=${game.dealer.cards[length-1].image} alt="${game.dealer.cards[length-1].value}">`)
    if (game.dealer.score > 17) {
        gameOver(game);
    } else {
        dealerPlay(game);
    }
}

export function gameOver(game) {
    let message = "";
    if (!game.player.been_split) {
        if (game.dealer.score > 21 && game.player.score > 21) {
            message = "Both busted. Push."
        } else if (game.player.score > 21) {
            message = "You busted. Dealer wins :("
        } else if (game.dealer.score > 21) {
            message = "Dealer busted. You win! :)"
        } else if (game.player.score > game.dealer.score) {
            message = "You had the higher score. You win! :)"
        } else if (game.player.score === game.dealer.score) {
            message = "Both had " + game.player.score + ". Push."
        } else {
            message = "Dealer had the higher score. Dealer wins :("
        }
    } else {
        for (let i=0; i<game.player.split.cards.length; i++) {
            message += "Hand " + (i+1) + ": ";
            const score = game.player.split.scores[i];
            if (game.dealer.score > 21 && score > 21) {
                message += "Both busted. Push. "
            } else if (score > 21) {
                message += "You busted. Dealer wins :( "
            } else if (game.dealer.score > 21) {
                message += "Dealer busted. You win! :) "
            } else if (score > game.dealer.score) {
                message += "You had the higher score. You win! :) "
            } else if (score ===  game.dealer.score) {
                message += "Both had " + score + ". Push."
            } else {
                message += "Dealer had the higher score. Dealer wins :( "
            }
        }
    }
    $('.play_buttons').empty();
    $('.play_buttons').append(`<button id="play_again_button">Play Again</button>`);
    $('.message').text(message);
}

export function playAgain(game) {
    game.clearGame();
    newGame();
}

export function errorMessage() {
    $('.message').text("Error. Something went wrong. No tokens were lost. Try again.");
}

$(function() {
    renderBlackjack();
})