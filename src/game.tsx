import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
  Turn,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

// Component for rendering a card image based on its suit and rank
const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

// Take a card from the top of the deck and return the remaining deck
const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

// Set up the initial game state
const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

//Scoring
// Calculate the score of a hand, consider the value of Aces and face cards
const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let numOfAces = 0;

  for (const card of hand) {
    switch (card.rank) {
      case CardRank.Ace:
        score += 11;
        numOfAces++;
        break; // Ace is worth 11 by default
      case CardRank.Jack:
      case CardRank.Queen:
      case CardRank.King:
        score += 10;
        break; // Face cards are worth 10
      default:
        score += parseInt(card.rank);
        break; // Number cards are worth their face value
    }
  }

  // If the score is over 21 and there are Aces in the hand, convert the value of the Aces to 1
  while (score > 21 && numOfAces > 0) {
    score -= 10;
    numOfAces--;
  }

  return score;
};

// TODO: Determine the game outcome based on the player's and dealer's scores
const determineGameResult = (state: GameState): GameResult => {
  const playerScore = calculateHandScore(state.playerHand);
  const dealerScore = calculateHandScore(state.dealerHand);

  if (
    playerScore === 21 &&
    state.playerHand.length === 2 &&
    state.dealerHand.length !== 2
  ) {
    return "player_win"; // Player has blackjack, dealer doesn't have blackjack
  }

  if (playerScore > 21) {
    return "dealer_win"; // Player busts
  }

  if (dealerScore > 21) {
    return "player_win"; // Dealer busts
  }

  if (playerScore === dealerScore) {
    return "draw"; // Player and dealer have the same score
  }

  if (playerScore > dealerScore) {
    return "player_win"; // Player has higher score than dealer
  }

  return "dealer_win"; // Dealer has higher score than player
};

//Player Actions
// Execute the "Stand" action for the player, allowing the dealer to take cards until their score is 17 or higher
const playerStands = (state: GameState): GameState => {
  // Implement the dealer's turn
  let newState = {
    ...state, // Copy the state
    turn: "dealer_turn" as Turn, // Change the turn to the dealer
  };

  // Dealer takes cards until their score is 17 or higher
  while (calculateHandScore(newState.dealerHand) <= 16) {
    const { card, remaining } = takeCard(newState.cardDeck); // Take a card from the deck
    newState = {
      ...newState,
      cardDeck: remaining,
      dealerHand: [...newState.dealerHand, card],
    }; // Add the card to the dealer's hand
  }

  return newState as GameState; // Return the new state
};

// Execute the "Hit" action for the player, taking a card from the deck and adding it to the player's hand
const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  // TODO: Handle the "Hit" action for the player

  // TODO: Handle the "Stand" action for the player

  // TODO: Handle the "Reset" action to start a new game

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) != "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
