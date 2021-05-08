import Blackjack from './blackjack.js';

export async function renderBlackjack() {
    const game = await newGame();
    game.clearGame()
    const $page = $('#page');
    $page.on("click", "#submit_initial_bet_button", (event) => placeInitialBet(event, game));
    $page.on("click", "#yes_insurance_button", (event) => handleYesNoPress(event, game));
    $page.on("click", "#no_insurance_button", (event) => handleYesNoPress(event, game));
    $page.on("click", "#split_button", (event) => handleSplit(event, game));
    $page.on("click", "#hit_button", (event) => handleHit(game));
    $page.on("click", "#stand_button", (event) => handleStand(game));
    $page.on("click", "#play_again_button", (event) => playAgain(event, game));
    $page.on("click", "#double_down_button", (event) => handleDD(event, game));
    $page.on("click", '#auth_button', (event) => loadAuth(event));
    $page.on("click", '#signup_button', (event) => signUp(event));
    $page.on("click", '.close', (event) => closeAuth(event));
    $page.on("click", '#submit_signup_button', (event) => handleSubmitSignup(event));
    $page.on("click", '#login_button', (event) => loadLoginForm(event));
    $page.on("click", '#submit_login_button', (event) => handleSubmitLogin(event));
    $page.on("click", '#signout_button', (event) => signOut(event));
    $page.on("click", '.drink_buttons', (event) => getDrink(event));
    $page.on("click", ".close_drink", (event) => closeDrink(event));
    $page.on("click", "#how_to_button", (event) => howToWindow(event));
    $page.on("click", ".close_how_to", (event) => closeHowTo(event));
    $page.on("click", ".close_opening", (event) => closeOpeningMessage(event));

}

export async function newGame() {
    let game = new Blackjack();
    const $root = $('#root');

    //clear page if anything remains
    $('#game').remove();
    $root.empty();
    addDrinkButtons();
    addHowToButton();

    const user = await getCurrentUser();
    let auth;
    if (user) {
        auth = "My Account/Sign Out"
    } else {
        auth = "Sign Up/Log In"
    }

    //add blackjack header and button box and set place for game
    const header =
        `<div class=auth>
            <button id=auth_button>${auth}</button>
        </div>
        <div class=modal>
            <div class=signup_login>
            </div>
        </div>
        <div class="header">
            <h1>Blackjack</h1>
            <h2 id="tokens"></h2>
        </div>
        <div class="player">
            <div class="player_info">
                <h2 id="player_name">Player</h2>
            </div>
            <div class="message_box">
                <h2 class="message">Place your bet. Minimum is 5. Maximum is 50.</h2>
                <h2 id="bet_message"></h2>
            </div>
            <div class="play_buttons">
                <div class="input_bet">
                    <input type="number" id="initial_bet_input" min="5" max="50" value="5">
                    <button type="submit" id="submit_initial_bet_button">Place Bet</button>
                </div>
            </div>
        </div>
        <div class="dealer">
            <div class="dealer_info">
                <h2>Dealer</h2>
                <h2 id="dealer_score"></h2>
            </div>
        </div>
        <div class="deck">
            <img src="card.PNG" alt="face down card">
        </div>`;

    $root.append(header);

    let points = 0;

    if (user) {
        const uid = user.uid;
        firebase.database().ref('/users/' + uid + '').get().then((snapshot) => {
            if (snapshot.exists()) {
                points = snapshot.val().points;
                $('#tokens').text("Your Tokens: " + (points));
            }
        })
    } else {
        $('#tokens').text("Sign up or log in to see your tokens");
    }

    return game;
}

export function placeInitialBet(event, game) {
    if (event) {event.preventDefault();}
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
    //get a new deck, shuffle it and draw 4 cards
    let deck;
    try {
        deck = await axios({
            method: 'get',
            url: 'https://deckofcardsapi.com/api/deck/new/draw/?count=4'
        });
    } catch (error) {
        $('.message').text("Something may have gone wrong. Try again.")
        console.log(error)
        return;
    }
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
    $('.player_info').append(`<h2 id="player_score">Score: ${game.player.score}</h2>`);
    const bets = 
        `<div class="player_bets">
            <h4 id="total_bet">Total Bet: ${bet}</h4>
            <h5 id="initial_bet">Initial Bet: ${bet}</h5>
            <h5 id="insurance_bet"></h5>
            <h5 id="double_down_bet"></h5>
            <h5 id="split_bet"></h5>
        </div>`
    const player =
        `<div class="cards" id="player_cards">
            <img src=${game.player.cards[0].image} alt="${game.player.cards[0].value}">
            <img src=${game.player.cards[1].image} alt="${game.player.cards[1].value}">
        </div>`;
    $('#root').append(bets);
    $('.player').append(player);
    //add dealer cards and bets
    const dealer =
        `<div class="cards" id="dealer_cards">
            <img id="face_down_card" src="card.PNG" alt="face down card">
            <img src=${game.dealer.cards[1].image} alt="${game.dealer.cards[1].value}">
        </div>`
    $('.dealer').append(dealer);
    //if dealer is showing ace, give option for insurance
    if (game.dealer.cards[1].value === "ACE") {
        //take insurance route
        insuranceBet(game);
    } else {
        //take normal route
        addPlayOptionButtons(game.player.cards[0], game.player.cards[1], false);
    }
}

export function insuranceBet(game) {
    //update message
    $('.message').text("Dealer is showing an ace. Would you like to place an insurance bet? Maximum bet is half your initial bet.");
    //add insurance options
    // console.log(game);
    const max = Math.ceil(game.player.bets.initial/2);
    const insurance =
        `<div class="insurance">
            <input id="insurance_bet_input" type="number" min=1 max=${max} value=${max}>
            <button id="yes_insurance_button">Yes</button>
            <button id="no_insurance_button">No</button>
        </div>`
    $('.play_buttons').append(insurance);
}

export function handleYesNoPress(event, game) {
    if (event) {event.preventDefault();}
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

export async function handleSplit(event, game) {
    if (event) {event.preventDefault();}
    console.log("handleSplit")
    //pull deck id to create url for API request
    const deck_id = game.deck_id;
    const url = 'https://deckofcardsapi.com/api/deck/' + deck_id + '/draw/?count=2'
    //draw 2 new cards
    let draw;
    try {
        draw = await axios({
            method: 'get',
            url: url
        });
    } catch (error) {
        $('.message').text("Something may have gone wrong. Try again.");
        return;
    }
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
    console.log("loadSplitCards")
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
            let card = `<div class="split" id="hand_${i+1}>`
            for (let j = 0; j < split[i].length; j++) {
                card += `<img src=${split[i][j].image} alt="${split[i][j].value}">`
            }
            card += `</div>`
            cards += card
        } else {
            //if hand hasn't been played, load the cards for it
            const card = 
            `<div class="split" id="hand_${i+1}">
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
    //add play option buttons
    addPlayOptionButtons(game.player.split.cards[pointer][0], game.player.split.cards[pointer][1]);
}

export async function handleHit(game) {
    console.log("handleHit")
    //pull deck id to create url for API request
    const deck_id = game.deck_id;
    const url = 'https://deckofcardsapi.com/api/deck/' + deck_id + '/draw/?count=1'
    //draw 1 new card
    let draw
    try {
        draw = await axios({
            method: 'get',
            url: url
        });
    } catch (error) {
        $('.message').text("Something may have gone wrong. Try again.");
        return;
    }
    $('.message').text("Hit or stand.");
    //if not successful, show error and stop code
    if (!draw.data['success']) {
        errorMessage();
        return;
    }
    //remove double down button, no longer an option for this hand
    $('#double_down_button').remove();
    //if hand hasn't been split
    if (!game.player.been_split) {
        if (game.player.double_down) {
            //update betting
            game.player.bets.double_down += game.player.bets.initial;
            game.player.bets.total += game.player.bets.initial;
            $('#total_bet').text("Total Bet: " + game.player.bets.total);
            $('#double_down_bet').text("Double Down Bet: " + game.player.bets.double_down);
        }
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
        console.log("pointer: " + index);
        //update betting
        if (game.player.split.double_down[index]) {
            game.player.bets.double_down += game.player.bets.initial;
            game.player.bets.total += game.player.bets.initial;
            $('#total_bet').text("Total Bet: " + game.player.bets.total);
            $('#double_down_bet').text("Double Down Bet: " + game.player.bets.double_down);
        }
        //add card to split hand pointer is at
        game.player.split.cards[index].push(draw.data['cards'][0]);
        //update score at pointer
        game.setSplitScore(index);
        const id = "#score_" + (index+1) + "";
        $(id).text("Score: " + game.player.split.scores[index]);
        //add card to DOM
        const ref = "#hand_" + (index+1) + "";
        const length = game.player.split.cards[index].length;
        $(ref).append(`<img src=${game.player.split.cards[index][length-1].image} alt="${game.player.split.cards[index][length-1].value}">`);
        //if hand busts or has 21
        if (game.player.split.scores[index] >= 21 && !game.player.split.double_down[index]) {
            //remove pointer class from current card at pointer
            const id_1 = "#hand_" + (game.player.split.pointer+1) + "";
            $(id_1).attr("class", "played");
            //if last hand in split cards
            if (game.player.split.cards.length === index+1) {
                //end of player's turn
                dealerPlay(game)
            } else {
                //change pointer to next hand in split cards
                game.player.split.pointer++;
            }
        } else if (game.player.split.double_down[index]) {
            handleStand(game);
        } else {
            $('.message').text("Hit or stand.");
        }

    }
}

export async function handleStand(game) {
    console.log("handing stand");
    console.log("game: ")
    console.log(game)
    //if hand hasn't been split, dealer's turn
    if (!game.player.been_split) {
        dealerPlay(game);
    //if last split hand to be played
    } else if (game.player.split.cards.length === game.player.split.pointer + 1) {
        //remove pointer class from current card at pointer
        const id_1 = "#hand_" + (game.player.split.pointer+1) + "";
        $(id_1).attr("class", "played");
        //end of player's turn
        dealerPlay(game)
    //change pointer to next hand in split cards
    } else {
        //remove pointer class from current card at pointer
        const id_1 = "#hand_" + (game.player.split.pointer+1) + "";
        $(id_1).attr("class", "played");
        //increment pointer
        game.player.split.pointer++;
        //load play option buttons with new pointer
        addPlayOptionButtons(game.player.split.cards[index][0], game.player.split.cards[index][1]);
    }
}

export function handleDD(event, game) {
    if (event) {event.preventDefault();}
    console.log("handleDD")
    //if no split hands
    if (!game.player.been_split) {
        game.player.double_down = true;
        //double down
        handleHit(game);
        // handleStand(game);
        // dealerPlay(game);
    } else {
        const pointer = game.player.split.pointer;
        game.player.split.double_down[pointer] = true;
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
    console.log("dealerDraw")
    //pull deck id to create url for API request
    const deck_id = game.deck_id;
    const url = 'https://deckofcardsapi.com/api/deck/' + deck_id + '/draw/?count=1'
    //draw 1 new card
    let draw;
    try {
        draw = await axios({
            method: 'get',
            url: url
        });
    } catch (error) {
        dealerDraw(game);
        return;
    }
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

export async function gameOver(game) {
    console.log("gameOver")
    let won = 0;
    let lost = 0;
    let message = "";
    if (!game.player.been_split) {
        //if dealer had Blackjack
        if (game.dealer.score === 21 && game.dealer.cards[1].value === "ACE" && game.dealer.cards.length === 2) {
            won += game.player.bets.insurance + game.player.bets.insurance;
        } else {
            lost += game.player.bets.insurance;
        }
        //handle busts
        if (game.dealer.score > 21 && game.player.score > 21) {
            message = "Both busted. Push."
        } else if (game.player.score > 21) {
            message = "You busted. Dealer wins :("
            lost += game.player.bets.initial + game.player.bets.double_down;
        } else if (game.dealer.score > 21) {
            message = "Dealer busted. You win! :)"
            won += game.player.bets.initial + game.player.bets.double_down;
        //handle 21
        } else if (game.player.score === 21 && game.player.cards.length == 2 && game.dealer.score !== 21) {
            message = "You got Blackjack and dealer did not. You win! :)"
            won += game.player.bets.initial + Math.round(game.player.bets.initial/2);
        } else if ((game.player.score === 21 && game.dealer.score === 21 && game.player.cards.length === 2 && game.dealer.cards.length > 2)) {
            message = "You got Blackjack and dealer did not. You win! :)"
            won += game.player.bets.initial + Math.round(game.player.bets.initial/2);
        } else if (game.dealer.score === 21 && game.dealer.cards.length === 2 && game.player.score !== 21) {
            message = "Dealer had Blackjack and you did not. Dealer wins :("
            lost += game.player.bets.initial + game.player.bets.double_down;
        //handle higher score & push
        } else if (game.player.score > game.dealer.score) {
            message = "You had the higher score. You win! :)"
            won += game.player.bets.initial + game.player.bets.double_down;
        } else if (game.player.score === game.dealer.score) {
            message = "Both had " + game.player.score + ". Push."
        } else {
            message = "Dealer had the higher score. Dealer wins :("
            lost += game.player.bets.initial + game.player.bets.double_down;
        }
    } else {
        for (let i=0; i<game.player.split.cards.length; i++) {
            message += "Hand " + (i+1) + ": ";
            const score = game.player.split.scores[i];
            if (game.dealer.score > 21 && score > 21) {
                message += "Both busted. Push. "
            } else if (score > 21) {
                message += "You busted. Dealer wins :( "
                //if split hand was doubled down
                if (game.player.split.double_down[i]) {
                    lost += game.player.bets.initial + game.player.bets.initial;
                } else {
                    lost += game.player.bets.initial;
                }
            } else if (game.dealer.score > 21) {
                message += "Dealer busted. You win! :) "
                //if split hand was doubled down
                if (game.player.split.double_down[i]) {
                    won += game.player.bets.initial + game.player.bets.initial;
                } else {
                    won += game.player.bets.initial;
                }
            } else if (score === 21 && game.player.split.cards[i].length === 2 && game.dealer.score !== 21) {
                message += "You got Blackjack and dealer did not. You win! :) "
                won += game.player.bets.initial + Math.round(game.player.bets.initial/2);
            } else if (score === 21 && game.dealer.score === 21 && game.player.split.cards[i].length === 2 && game.dealer.cards.length > 2 && score !== 21) {
                message += "You got Blackjack and dealer did not. You win! :) "
                won += game.player.bets.initial + Math.round(game.player.bets.initial/2);
            } else if (score > game.dealer.score) {
                message += "You had the higher score. You win! :) "
                //if split hand was doubled down
                if (game.player.split.double_down[i]) {
                    won += game.player.bets.initial + game.player.bets.initial;
                } else {
                    won += game.player.bets.initial;
                }
            } else if (score ===  game.dealer.score) {
                message += "Both had " + score + ". Push."
            } else {
                message += "Dealer had the higher score. Dealer wins :( "
                //if split hand was doubled down
                if (game.player.split.double_down[i]) {
                    lost += game.player.bets.initial + game.player.bets.initial;
                } else {
                    lost += game.player.bets.initial;
                }
            }
        }
    }
    $('.play_buttons').empty();
    $('.play_buttons').append(`<button id="play_again_button">Play Again</button>`);
    $('.message').text(message);
    await updatePoints1(won, lost)
    $('#bet_message').text("Won: " + won + " Lost: " + lost);
}

export function playAgain(event, game) {
    if (event) {event.preventDefault();}
    game.clearGame();
    newGame();
}

export function errorMessage() {
    $('.message').text("Error. Something went wrong. No tokens were lost. Try again.");
}

export function getCurrentUser() {
    console.log("getCurrentUser")
    let auth = firebase.auth();
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user)
        }, reject)
    })
}

export async function updatePoints1(won, lost) {
    const current = await getCurrentUser();
    if (current) {
        const uid = current.uid;
        let points = 0;
        let games_played = 0;
        firebase.database().ref('/users/' + uid + '').get().then((snapshot) => {
           if (snapshot.exists()) {
                console.log("points before updating:" + snapshot.val().points)
                points = snapshot.val().points + won - lost;
                games_played = snapshot.val().games_played + 1;
                console.log("points after updating: " + points);
                console.log("games_played: " + games_played);
                firebase.database().ref('/users/' + uid).update({'points': points, 'games_played': games_played});
                $('#tokens').text("Your Tokens: " + (points));
           }
        })
    }
}

export async function loadAuth(event) {
    if (event) {event.preventDefault();}
    $('.modal').css("display", "block");
    // $('#auth_button').replaceWith(`<button id="close_auth_button">Close Account Information</button>`);
    const user = await getCurrentUser();
    if (user) {
        $('.signup_login').replaceWith(
            `<div class="signup_login">
                <span class="close">&times;</span>
                <h5 class="auth_message">Currently logged in as: ${user.displayName}</h5>
                <button id="signout_button">Sign Out</button>
            </div>`
        )
    } else {
        $('.signup_login').replaceWith(
            `<div class="signup_login">
                <span class="close">&times;</span>
                <h5 class="auth_message">Create an account or log in!</h5>
                <button id="signup_button">Sign Up</button>
                <button id="login_button">Log In</button>
            </div>`
        )
    }
}

export async function closeAuth(event) {
    console.log("handling closeAuth")
    if (event) {event.preventDefault();}
    $('.modal').css("display", "none");
    const user = await getCurrentUser();
    let auth;
    if (user) {
        auth = "My Account/Sign Out"
    } else {
        auth = "Sign Up/Log In"
    }
    $('.auth').empty();
    $('.auth').append(`<button id=auth_button>${auth}</button>`);
}

export function signUp(event) {
    if (event) {event.preventDefault();}
   // create sign up form
   $('.signup_login').replaceWith(
    `<div class="signup_login">
        <span class="close">&times;</span>
        <form id="signup_form">
            <h2>Sign Up</h2>
            <input type="user_id" id="signup_name" placeholder="Name" minlength=1 required>
            <input type="email" id="signup_email" placeholder="Email Address" minlength=3 required>
            <input 
                type="password" 
                id="signup_password" 
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                placeholder="Password"
                minlength=8
                title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters" 
            required>
            <button id="submit_signup_button">Submit</button>
        </form>
        <div class=password_message>
            <h3>Password must contain the following:</h3>
            <p id=lowercase class=invalid>A lowercase letter</p>
            <p id=capital class=invalid>A capital (uppercase) letter</p>
            <p id=number class=invalid>A number</p>
            <p id=length class=invalid>Minimum of 8 characters</p>
        </div>
    </div>`
    )

    const pwd_element = $('#signup_password')

    // when user clicks on password field, message shows up
    pwd_element.on("focusin", function() {
        $('.password_message').css("display", "block");
    })

    //when user goes away from password field, message disappears
    pwd_element.on("blur", function () {
        $('.password_message').css("display", "none");
    })

    // when user starts typing
    pwd_element.on("keyup", function () {
        // validate lowercase letter
        const lowerCaseLetters = /[a-z]/g;
        if ($('#signup_password').val().match(lowerCaseLetters) != null) {
            $('#lowercase').removeClass("invalid");
            $('#lowercase').addClass("valid");
        } else {
            $('#lowercase').removeClass("valid");
            $('#lowercase').addClass("invalid");
        }
        // validate capital letter
        const upperCaseLetters = /[A-Z]/g;
        if ($('#signup_password').val().match(upperCaseLetters) != null) {
            $('#capital').removeClass("invalid");
            $('#capital').addClass("valid");
        } else {
            $('#capital').removeClass("valid");
            $('#capital').addClass("invalid");
        }
        //validate numbers
        const numbers = /[0-9]/g;
        if ($('#signup_password').val().match(numbers) != null) {
            $('#number').removeClass("invalid");
            $('#number').addClass("valid");
        } else {
            $('#number').removeClass("valid");
            $('#number').addClass("invalid");
        }
        // validate length
        if ($('#signup_password').val().length >= 8) {
            $('#length').removeClass("invalid");
            $('#length').addClass("valid");
        } else {
            $('#length').removeClass("valid");
            $('#length').addClass("invalid");
        }
    })
}

export function handleSubmitSignup(event) {
    if (event) {event.preventDefault();}

    // pull email and password from form
    const email = $('#signup_email').val();
    const password = $('#signup_password').val();
    const name = $('#signup_name').val();

    // create new user in firebase
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            setupUser(name, email);

            $('.signup_login').replaceWith(
                `<div class=signup_login>
                    <span class="close">&times;</span>
                    <h2 class=signup_complete_message></h2>
                </div>`
            )
            
            $('.signup_complete_message').text("Sign Up Successful. Welcome to the 426 Casino!");
        })
        .catch((error) => {
            // show error
            const errorCode = error.code;
            let errorMessage = error.message;
            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = "An account with this email address already exists. Login or use a different email address."
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = "Email address is invalid."
            } else if (errorCode === 'auth/operation-not-allowed') {
                errorMessage = "Email/Password accounts are not enabled. Sign up a different way."
            } else if (errorCode === 'weak-password') {
                errorMessage = "Password is not strong enough. Try adding symbols or numbers."
            } else {
                errorMessage = "";
            }
            $('.signup_login').append(`<h2>${errorMessage}</h2>`)
        });
}

export async function setupUser(name, email) {
    const current = await getCurrentUser();
    current.updateProfile({
        displayName: name,
        photoURL: 'https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png'
    })
    const database = firebase.database();
    const users_ref = database.ref('/users');
    const uid = current.uid;
    const user_ref = firebase.database().ref('/users/' + uid);
    user_ref.set({
        'points': 100,
        'email': email,
        'games_played': 0
    })
}

export function loadLoginForm(event) {
    console.log("loadLoginForm");
    if (event) {event.preventDefault();}
    // create login form
    $('.signup_login').replaceWith(
        `<div class=signup_login>
            <span class="close">&times;</span>
            <form id="login_form">
                <h2>Login</h2>
                <input type="email" id="login_email" placeholder="Email Address" minlength=3 required>
                <input 
                    type="password" 
                    id="login_password" 
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                    placeholder="Password"
                    minlength=8
                    title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters" 
                required>
                <button type="submit" id="submit_login_button">Submit</button>
            </form>
        </div>`
    )
}

export async function handleSubmitLogin(event) {
    if (event) {event.preventDefault();}

    const email = $('#login_email').val();
    const password = $('#login_password').val();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            var user = userCredential.user;
            const uid = user.uid;
            firebase.database().ref('/users/' + uid + '').get().then((snapshot) => {
                if (snapshot.exists()) {
                    const points = snapshot.val().points;
                    $('#tokens').text("Your Tokens: " + (points));
                }
            })
            $('.signup_login').replaceWith(
                `<div class=signup_login>
                    <span class="close">&times;</span>
                    <h2 class=login_complete_message></h2>
                </div>`
            )
            $('#auth_button').text("My Account");
            $('.login_complete_message').text("Login Successful. Welcome to the 426 Casino!");
            $('#tokens').text("Your Tokens: " + points);
        })
        .catch((error) => {
            const errorCode = error.code;
            let errorMessage = error.message;
            if (errorCode === 'auth/invalid-email') {
                errorMessage = "Email address is invalid."
            } else if (errorCode === 'auth/user-disabled') {
                errorMessage = "This account has been disabled."
            } else if (errorCode === 'auth/user-not-found') {
                errorMessage = "There is no user corresponding to the given email. Sign up or login with a different email address."
            } else if (errorCode === 'wrong-password') {
                errorMessage = "Password is incorrect."
            } else {
                errorMessage = ""
            }
            $('.signup_login').append(`<h2>${errorMessage}</h2>`)
        });

}

export function signOut(event) {
    event.preventDefault();
    firebase.auth().signOut().then(() => {
        $('.signup_login').replaceWith(
            `<div class="signup_login">
                <span class="close">&times;</span>
                <h5 id="display_name">Create an account or login!</h5>
                <button id="signup_button">Sign Up</button>
                <button id="login_button">Login</button>
            </div>`
        )
        $('#auth_button').text("Sign Up/Login")
        console.log("signed out")
    }).catch((error) => {
        $('#display_name').text("Sign out unsuccessful. Try again.");
    })
}

export function addDrinkButtons() {
    $('#root').append(
        `<div class="drink_buttons">
            <button class=drink id=sex_on_the_beach>Sex on the Beach</button>
            <button class=drink id=bahama_mama>Bahama Mama</button>
            <button class=drink id=pina_colada>Pina Colada</button>
            <button class=drink id=mai_tai>Mai Tai</button>
            <button class=drink id=strawberry_daiquiri>Strawberry Daiquiri</button>
        </div>
        <div class=modal_2>
            <div class=drink_info>
            </div>
        </div>`
    )
}

export async function getDrink(event) {
    event.preventDefault();
    const drink = event.target.id;
    const url = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=' + drink;
    let result;
    try {
        result = await axios({
            method: 'get',
            url: url
        })
    } catch (error) {
        $('.drink_info').append(`<h3>Something went wrong in pulling your drink. Try again.`);
        return;
    }

    console.log(result);

    const d = result.data['drinks'][0];
    let ingredients = [];
    let measure = [];
    for (let i=1; i < 16; i++) {
        const str = "strIngredient" + i;
        if (d[str] !== null) {
            ingredients[i-1] = d[str];
        }
        const m = "strMeasure" + i;
        if (d[m] !== null) {
            measure[i-1] = d[m];
        }
    }
    let ing = ``;
    for (let i=0; i < ingredients.length; i++) {
        if (measure[i]) {
            ing += `<li>${measure[i]} ${ingredients[i]}</li>`
        } else {
            ing += `<li>${ingredients[i]}</li>`
        }
    }
    $('.modal_2').css("display", "block");

    $('.drink_info').append(
        `<div class=drink_info>
            <span class="close_drink">&times;</span>
            <h2>${d.strDrink}</h2>
            <h5>Ingredients:</h5>
            <ul id=ingredients></ul>
            <h5>Instructions:</h5>
            <p>${d.strInstructions}</p>
            <h5>Enjoy!</h5>
            <img src=${d.strDrinkThumb} alt="thumbnail of drink">
        </div>`
    )
    $('#ingredients').append(ing);
}

export function closeDrink(event) {
    event.preventDefault();
    $('.drink_info').empty();
    $('.modal_2').css("display", "none");
}

export function addHowToButton() {
    $('#root').append(
        `<div class=modal_3>
            <div class=blackjack_instructions>
                <span class="close_how_to">&times;</span>
                <h3>How To Play Blackjack:</h3>
                <h4>Object of the Game</h4>
                <p>Player attempts to beat the dealer by getting a count as close to 21 as possible, without going over 21.</p>
                <h4>Card Values</h4>
                <p>Face cards (king, queen, jack) are worth 10. Aces are worth 1 or 11, whichever gives player the most points without going over 21 (ex: if an ace is being used as an 11 and player hits and scores over 21, ace will then be counted as a 1).
                All other cards are worth the number shown on the card.</p>
                <h4>Betting</h4>
                <p>Before the deal begins, player chooses how much they want to bet. Minimum bet is 5 tokens and maximum bet is 50 tokens.</p>
                <h4>The Deal</h4>
                <p>Card is dealt to player, then to dealer, and then repeated. Dealer's first card is face down. If the player's first two cards are an ace and a "ten-card" (a picture card or 10), giving a count of 21 in two cards, this is a natural or 
                "blackjack." If any player has a natural and the dealer does not, the dealer immediately pays the player one and a half times the amount of their bet, rounded up if bet is an odd number. If the dealer's face-up card is an ace, 
                they look at their face-down card to see if the two cards make a natural. If the face-up card is not a ten-card or an ace, they do not look at the face-down card until it is the dealer's turn to play.</p>
                <h4>The Play</h4>
                <h6>Basics</h6>
                <p>The player goes first and must decide whether to "stand" (not ask for another card) or "hit" (ask for another card in an attempt to get closer to a count of 21, or even hit 21 exactly). Thus, a player may stand on the two cards originally dealt to them, 
                or they may ask the dealer for additional cards, one at a time, until deciding to stand on the total (if it is 21 or under), or goes "bust" (if it is over 21). In the latter case, the player loses and the dealer collects the bet wagered.</p>
                <h6>Splitting Pairs</h6>
                <p>If the player's first two cards are of the same denomination, such as two jacks or two sixes, they may choose to treat them as two separate hands when their turn comes around. The amount of the original bet then goes on one of the cards, 
                and an equal amount must be placed as a bet on the other card. The player first plays the top hand by doubling down or standing or hitting one or more times; only then is the bottom hand played. The two hands are thus treated separately, 
                and the dealer settles with each on its own merits. A split hand may be split if again the first two cards dealt to the hand are of the same denomination.</p>
                <h6>Doubling Down</h6>
                <p>Another option open to the player is doubling their bet. When the player's turn comes, they place a bet equal to the original bet, and the dealer gives the player just one card. The player may double down on a split hand.</p>
                <h6>Insurance</h6>
                <p>When the dealer's face-up card is an ace, the player may make a side bet of up to half the initial bet that the dealer's face-down card is a ten-card, and thus a blackjack for the house. Once player decides whether they would like to place the insurance bet, 
                the dealer looks at the face-down card. If it is a ten-card, it is turned up, and if player placed an insurance bet, player is paid double the amount of their half-bet - a 2 to 1 payoff.</p>
                <h4>Settlement</h4>
                <p>If player and dealer both bust or get the same score, player gets to keep their bet. This is called a push. Otherwise, player's hand is compared against dealer's. If player got closer to 21 than the dealer without busting, player wins
                the amount of their initial bet. Otherwise, if the dealer got closer to 21 without busting, dealer wins and player loses their bet.</p>
                <br>
                <p>These instructions were derived from https://bicyclecards.com/how-to-play/blackjack/</p>
            </div>
        </div>
        <div class=how_to>
            <button id=how_to_button>How To Play Blackjack</button>
        </div>`
    )
}

export function howToWindow(event) {
    event.preventDefault();
    $('.modal_3').css("display", "block");
}

export function closeHowTo(event) {
    event.preventDefault();
    $('.modal_3').css("display", "none");
}

export function openingMessage() {
    $('#root').append(
        `<div class=modal_4>
            <div class=opening_message>
                <span class="close_opening">&times;</span>
                <h1>Welcome</h1>
                <h3>write something ab beaches & drinks & gambling here</h3>
            </div>
        </div>`
    )
}

export function closeOpeningMessage(event) {
    event.preventDefault();
    $('.modal_4').css("display", "none");
}

$(function() {
    renderBlackjack();
    openingMessage();
}) 