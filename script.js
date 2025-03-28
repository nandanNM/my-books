// DOM Elements
const searchInput = document.getElementById("search");
const listViewBtn = document.getElementById("list-view");
const gridViewBtn = document.getElementById("grid-view");
const sortSelect = document.getElementById("sort");
const booksContainer = document.querySelector(".books-container");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const currentPageSpan = document.getElementById("current-page");

// State Management
let currentPage = 1;
let currentQuery = "";
let currentView = "list";
let currentSort = "title";
let books = [];
let isLoading = false;
let pagination = {
  hasNextPage: false,
  hasPrevPage: false,
};

// Event Listeners

listViewBtn.addEventListener("click", () => switchView("list"));
gridViewBtn.addEventListener("click", () => switchView("grid"));
prevPageBtn.addEventListener("click", () => handlePageChange("prev"));
nextPageBtn.addEventListener("click", () => handlePageChange("next"));
searchInput.addEventListener("input", search);
sortSelect.addEventListener("change", (e) => handleSort(e.target.value));

// Initialize
const data = fetchBooks();
console.log("data", data);

// Functions

async function fetchBooks() {
  try {
    isLoading = true;
    updateLoadingState(true);

    const url = `https://api.freeapi.app/api/v1/public/books?page=${currentPage}&limit=10`;
    const options = { method: "GET", headers: { accept: "application/json" } };
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
    books = data.data || [];

    // Update pagination state
    pagination.hasNextPage = data.data.nextPage || false;
    pagination.hasPrevPage = data.data.previousPage || false;

    updatePaginationUI();
    renderBooks(books.data);
    return data.data || [];
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  } finally {
    isLoading = false;
    updateLoadingState(false);
  }
}

function switchView(view) {
  currentView = view;
  booksContainer.className = `books-container ${view}-view`;
  // Update active button states
  listViewBtn.classList.toggle("active", view === "list");
  gridViewBtn.classList.toggle("active", view === "grid");
}

function renderBooks(booksData) {
  booksContainer.innerHTML = booksData
    .map(
      (book) => `
        <a href="${book.volumeInfo.infoLink}" target="_blank" class="book-item">
            <div class="book-thumbnail">
                <img src="${
                  book.volumeInfo.imageLinks?.thumbnail ||
                  "https://via.placeholder.com/128x192"
                }" alt="${book.volumeInfo.title}">
            </div>
            <div class="book-info">
                <h2>${book.volumeInfo.title}</h2>
                <p class="author">By: ${
                  book.volumeInfo.authors?.join(", ") || "Unknown Author"
                }</p>
                <p class="publisher">Publisher: ${
                  book.volumeInfo.publisher || "Unknown Publisher"
                }</p>
                <p class="published-date">Published: ${
                  book.volumeInfo.publishedDate || "Unknown Date"
                }</p>
            </div>
        </a>
    `
    )
    .join("");
}

async function handlePageChange(direction) {
  if (isLoading) return;

  if (direction === "next" && pagination.hasNextPage) {
    currentPage++;
  } else if (direction === "prev" && pagination.hasPrevPage) {
    currentPage--;
  } else {
    return;
  }

  await fetchBooks();
}

function updatePaginationUI() {
  currentPageSpan.textContent = currentPage;
  prevPageBtn.disabled = !pagination.hasPrevPage || isLoading;
  nextPageBtn.disabled = !pagination.hasNextPage || isLoading;
}

function updateLoadingState(loading) {
  const buttons = [prevPageBtn, nextPageBtn];
  if (loading) {
    buttons.forEach((btn) => {
      btn.classList.add("loading");
      btn.disabled = true;
    });
    booksContainer.classList.add("loading");
  } else {
    buttons.forEach((btn) => {
      btn.classList.remove("loading");
    });
    booksContainer.classList.remove("loading");
    updatePaginationUI();
  }
}

function search(e) {
  const searchTerm = e.target.value.toLowerCase();
  console.log(books.data);
  const filteredBookes = books.data.filter(
    (book) =>
      book.volumeInfo.title.toLowerCase().includes(searchTerm) ||
      book.volumeInfo.authors.some((author) =>
        author.toLowerCase().includes(searchTerm)
      )
  );
  console.log("filteredBookes", filteredBookes);
  // Update the display with filtered results
  booksContainer.innerHTML = "";
  if (filteredBookes && filteredBookes.length > 0) {
    // console.log("filteredBookes", filteredBookes);
    renderBooks(filteredBookes);
  } else {
    booksContainer.innerHTML = "<p>No book found</p>";
  }
}

function handleSort(sortBy) {
  if (!books?.data || !books.data.length) return;

  const sortedBooks = [...books.data].sort((a, b) => {
    const bookA = a.volumeInfo;
    const bookB = b.volumeInfo;

    switch (sortBy) {
      case "title":
        return bookA.title
          .toLowerCase()
          .localeCompare(bookB.title.toLowerCase());

      case "date":
      case "publishedDate":
        // Convert dates to timestamps for comparison
        const dateA = new Date(bookA.publishedDate || "1900-01-01").getTime();
        const dateB = new Date(bookB.publishedDate || "1900-01-01").getTime();
        return dateB - dateA; // Most recent first

      case "author":
        const authorA = (bookA.authors?.[0] || "Unknown").toLowerCase();
        const authorB = (bookB.authors?.[0] || "Unknown").toLowerCase();
        return authorA.localeCompare(authorB);

      case "publisher":
        const publisherA = (bookA.publisher || "Unknown").toLowerCase();
        const publisherB = (bookB.publisher || "Unknown").toLowerCase();
        return publisherA.localeCompare(publisherB);

      default:
        return 0;
    }
  });

  // Update display with sorted books
  renderBooks(sortedBooks);
}
