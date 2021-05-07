export default class Blackjack {
    constructor() {
        this.player = {
            cards: [],
            score: 0,
            bets: {
                total: 0,
                initial: 0,
                insurance: 0,
                double_down: 0,
                split: 0
            },
            split: {
                cards: [],
                scores: [],
                double_down: [false, false, false, false, false, false, false, false, false, false, false, false],
                pointer: 0
            },
            been_split: false,
            double_down: false
        }

        this.dealer = {
            cards: [],
            score: 0
        }
        
        this.over = false;
        this.deck_id = 0;
    }

    clearGame() {
        console.log("blackjack clearGame")
        this.player = {
            cards: [],
            score: 0,
            bets: {
                total: 0,
                initial: 0,
                insurance: 0,
                double_down: 0,
                split: 0
            },
            split: {
                cards: [],
                scores: [],
                double_down: [false, false, false, false, false, false, false, false, false, false, false, false],
                pointer: 0
            },
            been_split: false,
            double_down: false
        }

        this.dealer = {
            cards: [],
            score: 0
        }
        
        this.over = false;
        this.deck_id = 0;

        return this;
    }

    setSplitScore(index) {
        console.log("blackjack setSplitScore")
        console.log("cards at pointer:")
        console.log(this.player.split.cards[index]);
        const cards = this.player.split.cards[index];
        let score = 0;
        let aces = 0;
        for (let i=0; i<cards.length; i++) {
            const value = cards[i]['value'];
            if (value === "KING" || value === "QUEEN" || value === "JACK") {
                score += 10;
            } else if (value === "ACE") {
                aces++;
            } else {
                score += parseInt(value, 10);
            }
        }

        if (aces > 0) {
            for (let i = 0; i < aces; i++) {
                if (score + 11 > 21) {
                    score++;
                } else {
                    score += 11;
                }
            }
        }
        this.player.split.scores[index] = score;
        console.log("score: " + score)
    }

    calculateSplitScore(index) {
        console.log("blackjack calculateSplitScore")
        const cards = this.player.split.cards[index];
        let score = 0;
        let aces = 0;
        for (let i=0; i<cards.length; i++) {
            const value = cards[i]['value'];
            if (value === "KING" || value === "QUEEN" || value === "JACK") {
                score += 10;
            } else if (value === "ACE") {
                aces++;
            } else {
                score += parseInt(value, 10);
            }
        }

        if (aces > 0) {
            for (let i = 0; i < aces; i++) {
                if (score + 11 > 21) {
                    score++;
                } else {
                    score += 11;
                }
            }
        }
        console.log("score: " + score)
        return score;
    }

    setPlayerScore() {
        console.log("blackjack setPlayerScore")
        const cards = this.player.cards;
        let score = 0;
        let aces = 0;
        for (let i=0; i<cards.length; i++) {
            const value = cards[i]['value'];
            if (value === "KING" || value === "QUEEN" || value === "JACK") {
                score += 10;
            } else if (value === "ACE") {
                aces++;
            } else {
                score += parseInt(value, 10);
            }
        }

        if (aces > 0) {
            for (let i = 0; i < aces; i++) {
                if (score + 11 > 21) {
                    score++;
                } else {
                    score += 11;
                }
            }
        }
        this.player.score = score;
        console.log("score: " + score)
    }

    setDealerScore() {
        console.log("blackjack setDealerScore")
        const cards = this.dealer.cards;
        let score = 0;
        let aces = 0;
        for (let i=0; i<cards.length; i++) {
            const value = cards[i]['value'];
            if (value === "KING" || value === "QUEEN" || value === "JACK") {
                score += 10;
            } else if (value === "ACE") {
                aces++;
            } else {
                score += parseInt(value, 10);
            }
        }

        if (aces > 0) {
            for (let i = 0; i < aces; i++) {
                if (score + 11 > 21) {
                    score++;
                } else {
                    score += 11;
                }
            }
        }
        this.dealer.score = score;
        console.log("score: " + score)
    }

}