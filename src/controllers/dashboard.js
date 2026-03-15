// sessionStorage
const user = JSON.parse(sessionStorage.getItem("loggedUser"));
if (!user) {
  window.location.href = "/src/view/login.html";
}

const wallet = user.wallet;

//Overview 
document.getElementById("greetingName").textContent = user.name;
document.getElementById("currentDate").textContent = new Date().toLocaleDateString("fr-FR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

document.getElementById("availableBalance").textContent = wallet.balance.toLocaleString("fr-FR") + " " + wallet.currency;

const revenus = wallet.transactions
  .filter(t => t.type === "credit")
  .reduce((sum, t) => sum + t.amount, 0);
document.getElementById("monthlyIncome").textContent = revenus.toLocaleString("fr-FR") + " " + wallet.currency;

const depenses = wallet.transactions
  .filter(t => t.type === "debit")
  .reduce((sum, t) => sum + t.amount, 0);
document.getElementById("monthlyExpenses").textContent = depenses.toLocaleString("fr-FR") + " " + wallet.currency;

document.getElementById("activeCards").textContent = wallet.cards.length;

// Cards 
const cardItem = document.querySelector(".card-item");
const firstCard = wallet.cards[0];
cardItem.querySelector(".card-preview").className = "card-preview " + firstCard.type;
cardItem.querySelector(".card-number").textContent = firstCard.numcards;
cardItem.querySelector(".card-holder").textContent = user.name;
cardItem.querySelector(".card-expiry").textContent = firstCard.expiry;
cardItem.querySelector(".card-type").textContent = firstCard.type.toUpperCase();

// Additional cards
const cardsGrid = document.getElementById("cardsGrid");
for (let i = 1; i < wallet.cards.length; i++) {
  const clone = cardItem.cloneNode(true);
  clone.querySelector(".card-preview").className = "card-preview " + wallet.cards[i].type;
  clone.querySelector(".card-number").textContent = wallet.cards[i].numcards;
  clone.querySelector(".card-holder").textContent = user.name;
  clone.querySelector(".card-expiry").textContent = wallet.cards[i].expiry;
  clone.querySelector(".card-type").textContent = wallet.cards[i].type.toUpperCase();
  cardsGrid.appendChild(clone);
}

// Transfer Form 
const sourceCardSelect = document.getElementById("sourceCard");
const sourceOpt = sourceCardSelect.querySelector("option[value='visa-4242']");
sourceOpt.value = wallet.cards[0].numcards;
sourceOpt.textContent = wallet.cards[0].type.toUpperCase() + " - " + wallet.cards[0].numcards + " (" + Number(wallet.cards[0].balance).toLocaleString("fr-FR") + " " + wallet.currency + ")";

for (let i = 1; i < wallet.cards.length; i++) {
  const opt = sourceOpt.cloneNode(true);
  opt.value = wallet.cards[i].numcards;
  opt.textContent = wallet.cards[i].type.toUpperCase() + " - " + wallet.cards[i].numcards + " (" + Number(wallet.cards[i].balance).toLocaleString("fr-FR") + " " + wallet.currency + ")";
  sourceCardSelect.appendChild(opt);
}

const beneficiarySelect = document.getElementById("beneficiary");
const benOpt = beneficiarySelect.querySelector("option[value='1']");
const beneficiaries = wallet.transactions
  .filter(t => t.type === "debit")
  .map(t => t.to)
  .filter((v, i, a) => a.indexOf(v) === i);

benOpt.value = beneficiaries[0];
benOpt.textContent = beneficiaries[0];

for (let i = 1; i < beneficiaries.length; i++) {
  const opt = benOpt.cloneNode(true);
  opt.value = beneficiaries[i];
  opt.textContent = beneficiaries[i];
  beneficiarySelect.appendChild(opt);
}

// Recent Transactions 
const transactionsList = document.getElementById("recentTransactionsList");
const txTemplate = transactionsList.querySelector(".transaction-item");

wallet.transactions.forEach((t, index) => {
  const el = index === 0 ? txTemplate : txTemplate.cloneNode(true);
  el.textContent = "";

  const icon = document.createElement("i");
  icon.className = t.type === "credit" ? "fas fa-arrow-down" : "fas fa-arrow-up";

  const nameSpan = document.createElement("span");
  nameSpan.className = "transaction-name";
  nameSpan.textContent = t.type === "credit" ? t.from : t.to;

  const dateSpan = document.createElement("span");
  dateSpan.className = "transaction-date";
  dateSpan.textContent = t.date;

  const amountSpan = document.createElement("span");
  amountSpan.className = "transaction-amount " + (t.type === "credit" ? "green" : "red");
  amountSpan.textContent = (t.type === "credit" ? "+" : "-") + t.amount.toLocaleString("fr-FR") + " " + wallet.currency;

  el.appendChild(icon);
  el.appendChild(nameSpan);
  el.appendChild(dateSpan);
  el.appendChild(amountSpan);

  if (index !== 0) transactionsList.appendChild(el);
});

// Sidebar Navigation
document.querySelectorAll(".sidebar-nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".sidebar-nav li").forEach(li => li.classList.remove("active"));
    link.parentElement.classList.add("active");

    const target = link.getAttribute("href").replace("#", "");
    document.querySelectorAll(".dashboard-section").forEach(s => s.classList.remove("active"));

    if (target === "transfers") {
      document.getElementById("transfer-section").classList.remove("hidden");
    } else {
      document.getElementById("transfer-section").classList.add("hidden");
      const section = document.getElementById(target);
      if (section) section.classList.add("active");
    }
  });
});

// Quick transfer button 
document.getElementById("quickTransfer").addEventListener("click", () => {
  document.getElementById("transfer-section").classList.remove("hidden");
});

// Close / Cancel transfer 
document.getElementById("closeTransferBtn").addEventListener("click", () => {
  document.getElementById("transfer-section").classList.add("hidden");
});
document.getElementById("cancelTransferBtn").addEventListener("click", () => {
  document.getElementById("transfer-section").classList.add("hidden");
});



function checkAmount(amount, callback) {
  setTimeout(() => {
    if (!amount || amount <= 0) {
      callback("Le montant doit être supérieur à 0.");
    } else {
      callback(null);
    }
  }, 300);
}

function checkSolde(card, amount, callback) {
  setTimeout(() => {
    if (Number(card.balance) < amount) {
      callback("Solde insuffisant sur cette carte.");
    } else {
      callback(null);
    }
  }, 300);
}

function checkBeneficiaire(beneficiary, callback) {
  setTimeout(() => {
    if (!beneficiary) {
      callback("Veuillez sélectionner un bénéficiaire.");
    } else {
      callback(null);
    }
  }, 300);
}

function createTransaction(card, amount, beneficiary, callback) {
  setTimeout(() => {
    const newTransaction = {
      id: String(wallet.transactions.length + 1),
      type: "debit",
      amount: amount,
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      from: card.numcards,
      to: beneficiary
    };
    wallet.transactions.push(newTransaction);
    callback(null, newTransaction);
  }, 300);
}

function debitCredit(card, amount, callback) {
  setTimeout(() => {
    card.balance = String(Number(card.balance) - amount);
    wallet.balance -= amount;
    callback(null);
  }, 300);
}

// Handle transfer form submission
document.getElementById("transferForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("amount").value);
  const sourceCardNum = document.getElementById("sourceCard").value;
  const beneficiary = document.getElementById("beneficiary").value;
  const card = wallet.cards.find(c => c.numcards === sourceCardNum);

  // Step 1: Check Amount
  checkAmount(amount, (err) => {
    if (err) return alert(err);

    // Step 2: Check Solde
    checkSolde(card, amount, (err) => {
      if (err) return alert(err);

      // Step 3: Check Bénéficiaire
      checkBeneficiaire(beneficiary, (err) => {
        if (err) return alert(err);

        // Step 4: Create Transaction
        createTransaction(card, amount, beneficiary, (err, transaction) => {
          if (err) return alert(err);

          // Step 5: Debit/Credit
          debitCredit(card, amount, (err) => {
            if (err) return alert(err);

            // Update sessionStorage and refresh UI
            sessionStorage.setItem("loggedUser", JSON.stringify(user));
            refreshUI();
            document.getElementById("transfer-section").classList.add("hidden");
            document.getElementById("transferForm").reset();
            alert("Transfert effectué avec succès !");
          });
        });
      });
    });
  });
});

// Refresh UI after transfer 
function refreshUI() {
  document.getElementById("availableBalance").textContent = wallet.balance.toLocaleString("fr-FR") + " " + wallet.currency;

  const rev = wallet.transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  document.getElementById("monthlyIncome").textContent = rev.toLocaleString("fr-FR") + " " + wallet.currency;

  const dep = wallet.transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  document.getElementById("monthlyExpenses").textContent = dep.toLocaleString("fr-FR") + " " + wallet.currency;

  document.getElementById("activeCards").textContent = wallet.cards.length;

  // Update source card options text 
  sourceCardSelect.querySelectorAll("option:not([disabled])").forEach((opt, i) => {
    const c = wallet.cards[i];
    opt.textContent = c.type.toUpperCase() + " - " + c.numcards + " (" + Number(c.balance).toLocaleString("fr-FR") + " " + wallet.currency + ")";
  });
}
