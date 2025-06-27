// my approach - due to limited time, i didnt want to create the game from scratch.
// i did, however, wanted to take the challange and make it somewhat scalable, by using an array to manage all the 
// different themes. this will allow me to create only one "theme selector" function, and mangage all the DOM elemets.
//this scalability also makes the "random" bonus very easy

//theme configurations:
//each theme defines how to get the card data
let cardNumber = 6; //this works, both in game level (exept for the superheros) and in api calls, no time to add it to DOM. or to better style CSS.
const container = document.querySelector(".memory-game");
const THEMES = {
  superheroes: {
    label: "Superheroes",
    local: true, // means I don't need to fetch, just use local images
    cards: [
      { name: "wonderWoman", img: "img/Wonder_Woman.webp" },
      { name: "catWoman", img: "img/Catwoman.jpg" },
      { name: "flash", img: "img/the-flash.webp" },
      { name: "batman", img: "img/Batman_Vol_3_86_Textless.webp" },
      { name: "spiderman", img: "img/spiderman.jpg" },
      { name: "ironman", img: "img/ironman.webp" }
    ]
  },
  harryPotter: {
    label: "Harry Potter",
    dataResponse: data => data,
    source: "https://hp-api.onrender.com/api/characters",
    extract: character => ({ name: character.name, img: character.image })
  },

  pokemon: {
    label: "Pokémon",
    dataResponse: data => data.results,
    source: "https://pokeapi.co/api/v2/pokemon-species?limit=300",
    extract: pokemon => {
      const arryFromUrl = pokemon.url.split("/").filter(Boolean);
      const id = arryFromUrl[arryFromUrl.length - 1];
      return  {
        name: pokemon.name,
        img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
      };
    }
  },
  
  dogs: {
    label: "Dogs",
    dataResponse: data => data.message,
    backface:"",
    source: `https://dog.ceo/api/breeds/image/random/${cardNumber}`,
    extract: dog => {
      const arryFromUrl = dog.split("/").filter(Boolean);
      const breed = arryFromUrl[arryFromUrl.length - 2];
      return{
      name: breed,
      img: dog,
      };
    } 
  },

  
  random: {
    label: "Random Deck",
    async choseRandomTheme() {
      const allThemes = Object.keys(THEMES).filter(theme => theme !== "random");
      const validThemes = [];

      for (let themeName of allThemes) {
        const theme = THEMES[themeName];

        if (theme.local === true) {
          validThemes.push(themeName);
          continue;
        }

        //the problem with the following code, is that i have many API requests each time i press random. 
        //however - i dont know how to store data like images yet, and i ran out of time.
        //maybe the right approach will be to store a flag each time an API is called succesfuly during the session
        //and then the i will only check the non flagged APIs, then i will request only - each time i press a theme or
        // if i never pressed this theme. maybe i will keep working on it when i have more time.
        try {
          const response = await fetch(theme.source, { method: "GET" });
          if (response.ok) {
            validThemes.push(themeName);
          }
        } catch (error) {
          console.error(`Error fetching theme ${themeName}: ${error}`);
        }
      }

      if (validThemes.length === 0) {
        alert("Sorry, No theme is working.");
        return null;
      }

      const randomIndex = Math.floor(Math.random() * validThemes.length);
      let selectedTheme = validThemes[randomIndex];
      console.log("Random theme chosen:", selectedTheme);
      return selectedTheme;
    }

  },
  //exmple for an error api
  Errorexample: {
    label: "Error Example",
    source: "https://www.walla.co.il",
    extract: blabla => {
      const id = ""
      return {
        name: "",
        img: ""
      };
    }
  },
};
let currentTheme = "superheroes";

// Flag for letting us know if a card already been flipped
let hasFlippedCard = false;

// Flag for locking the board when two cards been flipped
// Prevents us from flipping more cards when our app calculates the results
let lockBoard = false;

// Variables for saving the current card selections after the user chose to flip them
let firstCard, secondCard;

// function for flipping the card
function flipCard() {
  // We don't allow to flip the card if the board is locked
  if (lockBoard) return;
  // We don't allow to flip the card if we already flipped this card
  if (this === firstCard) return;

  // adding the class flip to the selected card
  this.classList.add("flip");

  // If we don't already flipped a card (first card flipped)
  if (!hasFlippedCard) {
    // Flag to true -> flipped a card and save to firstCard the selected card
    hasFlippedCard = true;
    firstCard = this;
    return;
  }

  // If we already flipped a card (second card flipped)
  // save to secondCard the selected card
  secondCard = this;
  // Call checkForMatch() method to see if cards are matched
  checkForMatch();
}

function checkForMatch() {
  // dataset will contain all the HTML properties that has "data-{name}"
  // we can get those properties by calling element.dataset.{name}
  let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;

  // if the dataset name of the two cards is the same -> we will call disableCards()
  // else -> we will call unflipCards()
  isMatch ? disableCards() : unflipCards();
}

// Function that will make sure that we can't flip the cards again in the game
// the function is removing the eventListener for "click" from both cards
function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);
  // we should call reset to make sure that the user can now choose again two cards
  resetConditions();
}

// Function that will unflip the selected cards in case they are not matched
function unflipCards() {
  // during the unflip time we don't want to allow the user to flip other cards
  // so lockBoard should be true
  lockBoard = true;

  // the unflip functionality is by removing the "flip" class from both cards and reset the board
  // we want to start this logic only 1.5 seconds after the unflipCards() was triggered
  // because if we don't, our app will immediately flip the cards before we are able to see it
  setTimeout(() => {
    firstCard.classList.remove("flip");
    secondCard.classList.remove("flip");
    resetConditions();
  }, 1000);
}


// handle flip-unflip animation
function flipALLCards() {
  const cards = Array.from(document.querySelectorAll(".memory-card"));
  if (!cards.length) return; // ✅ No cards to flip

  cards.forEach(card => {
    if (card) card.classList.add("flip");
  });

  setTimeout(() => {
    cards.forEach(card => {
      if (card) card.classList.remove("flip");
    });
  }, 500);
}

// Function that should reset all flags back to false and all card variables back to null
//nitsan: needed to extand the originalresetBoard function, to handle true reset. to maintain the login, i changed it name
function resetConditions() {
  hasFlippedCard = false;
  lockBoard = false;
  firstCard = null;
  secondCard = null;
}

//nitsan: this function rests the borad.
function newGame() {
  loadTheme(currentTheme);
  setTimeout(flipALLCards(),200);
}



// This function shuffles the cards when the game starts
//Nitsan: didnt like it, replaced it with a better shuffle
// function shuffle() {
//   cards.forEach((card) => {
//     let randomPos = Math.floor(Math.random() * (cardNumber * 2));
//     card.style.order = randomPos;
//   });
// };

function shuffleDOMCards() {
  const cardArray = Array.from(document.querySelectorAll(".memory-card"));
  shuffleArray(cardArray).forEach((card, i) => {
    card.style.order = i;
  });
}
//Nitsan: No longer needed, binded in different function.
// // Add a "click" event listener that will trigger flipCard on every card element
// cards.forEach((card) => card.addEventListener("click", flipCard));


// my code:

// Utility: Shuffle an array in place. general shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Apply character images and names to cards
function applyDeck(deck) {
container.innerHTML = "";

deck.forEach(item => {
  const card = document.createElement("div");
  card.classList.add("memory-card");
  card.dataset.framework = item.name;

  const front = document.createElement("img");
  front.classList.add("front-face");
  front.src = item.img;
  front.alt = item.name;

  const back = document.createElement("img");
  back.classList.add("back-face");
  back.src = "img/avengers.webp"; //fixed backface, sorry, i was lazy :)
  back.alt = `${item.name} badge`;

  card.appendChild(front);
  card.appendChild(back);
  card.addEventListener("click", flipCard);

  container.appendChild(card);
});
resetConditions();
shuffleDOMCards();
setTimeout(flipALLCards, 100);}


// Main theme loader
async function loadTheme(themeName) {


  if (themeName === "random") {
    const selectedName = await THEMES.random.choseRandomTheme();
    if (!selectedName) return;
    themeName = selectedName;
  };  

  let theme = THEMES[themeName];
  if (!theme) return alert("Theme not found!");
  currentTheme = themeName;

  if (theme.local) {
    const fullDeck = shuffleArray([...theme.cards, ...theme.cards]);
    applyDeck(fullDeck);
    return;
  }

  fetch(theme.source)
    .then(res => res.json())
    .then(data => {
    const results = theme.dataResponse(data) //handles different API responses, 
    const extracted = results
      .map(theme.extract)
      .filter(c => c.name && c.img);
      if (extracted.length < cardNumber) {
          alert("Not enough characters with images in this theme.");
          return;
      };

      const uniqueMap = new Map();
      extracted.forEach(char => {
        if (!uniqueMap.has(char.name)) uniqueMap.set(char.name, char);
      });

      const selected = shuffleArray([...uniqueMap.values()]).slice(0, cardNumber);
      const fullDeck = shuffleArray([...selected, ...selected]);

      applyDeck(fullDeck);
    })
    .catch(err => {
      console.error(`Failed to load ${themeName}`, err);
      alert("Error loading theme: " + theme.label);
      loadTheme("superheroes");

    }); 
}

// Create buttons for each theme
function createThemeButtons() {
  const container = document.getElementById("theme-buttons");
  Object.keys(THEMES).forEach(themeName => {
    const btn = document.createElement("button");
    btn.innerText = THEMES[themeName].label;
    btn.onclick = () => {
      loadTheme(themeName);        
    };
    container.appendChild(btn);
  });
}

// On page load, generate buttons and load default theme
createThemeButtons();
loadTheme(currentTheme);

