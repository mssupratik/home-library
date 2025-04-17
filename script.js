let books = JSON.parse(localStorage.getItem("books")) || [];
let users = JSON.parse(localStorage.getItem("users")) || [
  { username: "admin", password: "admin123", isAdmin: true }
];
let currentUser = null;

const bookFormSection = document.getElementById("book-form-section");
const bookForm = document.getElementById("book-form");
const booksContainer = document.getElementById("books-container");
const authSection = document.getElementById("auth-section");
const loginArea = document.getElementById("login-area");
const registerArea = document.getElementById("register-area");
const welcomeMessage = document.getElementById("welcome-message");
const logoutBtn = document.getElementById("logout-btn");
const manualScanSection = document.getElementById("manual-scan-section");
const groupFilterSection = document.getElementById("group-filter-section");
const groupFilter = document.getElementById("group-filter");
const editModal = document.getElementById("edit-modal");

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    loadUI();
  } else {
    alert("Invalid login");
  }
}

function register() {
  const newUsername = document.getElementById("new-username").value.trim();
  const newPassword = document.getElementById("new-password").value;

  if (users.some(u => u.username === newUsername)) {
    alert("Username already exists.");
    return;
  }

  const newUser = { username: newUsername, password: newPassword, isAdmin: false };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  alert("Registered! You can now log in.");
  toggleRegister(false);
}

function toggleRegister(show) {
  loginArea.style.display = show ? "none" : "block";
  registerArea.style.display = show ? "block" : "none";
}

function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  loadUI();
}

logoutBtn.onclick = logout;

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const overview = document.getElementById("overview").value.trim();
  const review = document.getElementById("review").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const rating = parseInt(document.getElementById("rating").value);
  const barcode = document.getElementById("barcode").value.trim();
  const group = document.getElementById("group").value.trim();
  const imageInput = document.getElementById("image");

  const reader = new FileReader();
  reader.onload = function () {
    const newBook = {
      title, overview, review, price, rating,
      barcode, group, image: reader.result, taken: false
    };
    books.push(newBook);
    localStorage.setItem("books", JSON.stringify(books));
    bookForm.reset();
    renderBooks();
    updateGroupFilterOptions();
  };

  if (imageInput.files.length > 0) {
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    const newBook = {
      title, overview, review, price, rating,
      barcode, group, image: null, taken: false
    };
    books.push(newBook);
    localStorage.setItem("books", JSON.stringify(books));
    bookForm.reset();
    renderBooks();
    updateGroupFilterOptions();
  }
});

function renderBooks(filterGroup = "") {
  booksContainer.innerHTML = "";
  const sortedBooks = books
    .filter(book => !filterGroup || book.group === filterGroup)
    .sort((a, b) => a.title.localeCompare(b.title));

  sortedBooks.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <h3>${book.title}</h3>
      ${book.image ? `<img src="${book.image}" alt="${book.title}" />` : ""}
      <p><strong>Overview:</strong> ${book.overview}</p>
      <p><strong>Review:</strong> ${book.review}</p>
      <p><strong>Price:</strong> ₹${book.price}</p>
      <p><strong>Rating:</strong> ${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}</p>
      <p><strong>Group:</strong> ${book.group || "None"}</p>
      <p><strong>Status:</strong> ${book.taken ? "📕 Taken" : "📘 Available"}</p>
      <div class="book-actions">
        ${book.taken ? `<button onclick="returnBook('${book.barcode}')">Return Book</button>` : ""}
        <button onclick="openEditModal('${book.barcode}')">Edit</button>
      </div>
    `;
    booksContainer.appendChild(card);
  });
}

function openEditModal(barcode) {
  const book = books.find(b => b.barcode === barcode);
  if (!book) return;

  document.getElementById('edit-barcode').value = book.barcode;
  document.getElementById('edit-title').value = book.title;
  document.getElementById('edit-overview').value = book.overview;
  document.getElementById('edit-review').value = book.review || '';
  document.getElementById('edit-price').value = book.price;
  document.getElementById('edit-rating').value = book.rating;
  document.getElementById('edit-group').value = book.group || '';
  
  editModal.style.display = 'flex';
}

function closeEditModal() {
  editModal.style.display = 'none';
  document.getElementById('edit-form').reset();
}

document.getElementById('edit-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const barcode = document.getElementById('edit-barcode').value;
  const bookIndex = books.findIndex(b => b.barcode === barcode);
  
  if (bookIndex !== -1) {
    books[bookIndex] = {
      ...books[bookIndex],
      title: document.getElementById('edit-title').value.trim(),
      overview: document.getElementById('edit-overview').value.trim(),
      review: document.getElementById('edit-review').value.trim(),
      price: parseFloat(document.getElementById('edit-price').value),
      rating: parseInt(document.getElementById('edit-rating').value),
      group: document.getElementById('edit-group').value.trim()
    };
    
    localStorage.setItem('books', JSON.stringify(books));
    renderBooks();
    closeEditModal();
  }
});

function manualScan() {
  const barcode = document.getElementById("manual-barcode").value.trim();
  const bookIndex = books.findIndex(book => book.barcode === barcode && !book.taken);

  if (bookIndex !== -1) {
    books[bookIndex].taken = true;
    localStorage.setItem("books", JSON.stringify(books));
    alert(`Book "${books[bookIndex].title}" marked as taken.`);
    document.getElementById("manual-barcode").value = "";
    renderBooks();
  } else {
    alert("No available book found with that barcode.");
  }
}

function returnBook(barcode) {
  const bookIndex = books.findIndex(book => book.barcode === barcode);
  if (bookIndex !== -1 && books[bookIndex].taken) {
    books[bookIndex].taken = false;
    localStorage.setItem("books", JSON.stringify(books));
    alert(`Book "${books[bookIndex].title}" has been returned.`);
    renderBooks();
  }
}

function updateGroupFilterOptions() {
  const groups = [...new Set(books.map(book => book.group).filter(Boolean))];
  groupFilter.innerHTML = `<option value="">All</option>` +
    groups.map(g => `<option value="${g}">${g}</option>`).join("");
}

function filterByGroup() {
  const selectedGroup = groupFilter.value;
  renderBooks(selectedGroup);
}

function loadUI() {
  currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    authSection.style.display = "none";
    welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
    logoutBtn.style.display = "inline-block";

    if (currentUser.isAdmin) {
      bookFormSection.style.display = "block";
    } else {
      bookFormSection.style.display = "none";
    }

    manualScanSection.style.display = "block";
    groupFilterSection.style.display = "block";
    renderBooks();
    updateGroupFilterOptions();
  } else {
    authSection.style.display = "block";
    bookFormSection.style.display = "none";
    booksContainer.innerHTML = "";
    logoutBtn.style.display = "none";
    welcomeMessage.textContent = "";
    manualScanSection.style.display = "none";
    groupFilterSection.style.display = "none";
  }
}

loadUI();