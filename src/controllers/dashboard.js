import {getbeneficiaries ,finduserbyaccount,findbeneficiarieByid} from "../Model/database.js";
const user = JSON.parse(sessionStorage.getItem("currentUser"));
// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn=document.getElementById("submitTransferBtn");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
  transferBtn.addEventListener("click", handleTransfersection);
  closeTransferBtn.addEventListener("click", closeTransfer);
  cancelTransferBtn.addEventListener("click", closeTransfer);
  submitTransferBtn.addEventListener("click",handleTransfer)


// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard(){
const dashboardData = getDashboardData();
if (dashboardData) {
  greetingName.textContent = dashboardData.userName;
  currentDate.textContent = dashboardData.currentDate;
  solde.textContent = dashboardData.availableBalance;
  incomeElement.textContent = dashboardData.monthlyIncome;
  expensesElement.textContent = dashboardData.monthlyExpenses;
  activecards.textContent = dashboardData.activeCards;
}
// Display transactions
transactionsList.innerHTML = "";
user.wallet.transactions.forEach(transaction => {
  const transactionItem = document.createElement("div");
  transactionItem.className = "transaction-item";
  transactionItem.innerHTML = `
    <div>${transaction.date}</div>
    <div>${transaction.amount} MAD</div>
    <div>${transaction.type}</div>
  `;
  transactionsList.appendChild(transactionItem);
});

}
renderDashboard();

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();
function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type+"****"+card.numcards;
    sourceCard.appendChild(option);
  });
}

renderCards();

// transfer

function checkUser(numcompte) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const beneficiary = finduserbyaccount(numcompte);
            if (beneficiary) {
                resolve(beneficiary); 
            } else {
                reject("Beneficiary not found"); 
            }
        }, 2000);
    });
}

function checkSolde(expediteur, amount) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (expediteur.wallet.balance >= amount) {
                resolve("Sufficient balance");
            } else {
                reject("Insufficient balance");
            }
        }, 3000);
    });
}

function updateSolde(expediteur, destinataire, amount) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            expediteur.wallet.balance -= amount;
            destinataire.wallet.balance += amount;
            resolve("Update balance done");
        }, 200);
    });
}

function addtransactions(expediteur, destinataire, amount) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const dateStr = new Date().toLocaleString(); 
            
            // create credit transaction
            const credit = {
                id: Date.now(),
                type: "credit",
                amount: amount,
                date: dateStr,
                from: expediteur.name
            };
            
            // create debit transaction
            const debit = {
                id: Date.now() + 1, 
                type: "debit",
                amount: amount,
                date: dateStr,
                to: destinataire.name,
            };
            
            expediteur.wallet.transactions.push(debit);
            destinataire.wallet.transactions.push(credit);
            resolve("Transaction added successfully");
        }, 3000);
    });
}
function transfer(expediteur, numcompte, amount) {
    console.log("DÉBUT DU TRANSFERT...");
  
    let destinataireTrouve;

    checkUser(numcompte)
        .then((destinataire) => {
            console.log("Étape 1: Destinataire trouvé -", destinataire.name);
            destinataireTrouve = destinataire; 
            return checkSolde(expediteur, amount);
        })
        .then((soldemessage) => {
            console.log("Étape 2:", soldemessage);
            
            // On retourne la promesse suivante en utilisant le destinataire sauvegardé
            return updateSolde(expediteur, destinataireTrouve, amount);
        })
        .then((updatemessage) => {
            console.log("Étape 3:", updatemessage);
            return addtransactions(expediteur, destinataireTrouve, amount);
        })
        .then((addtransactionMessage) => {
            console.log("Étape 4:", addtransactionMessage);
            console.log(`Transfert de ${amount} MAD réussi!`);
            
            renderDashboard(); 
        })
        .catch((erreur) => {
            console.error("Échec du transfert :", erreur);
        });
}

function handleTransfer(e) {
    e.preventDefault();
    const beneficiaryId = document.getElementById("beneficiary").value;
    const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
    
    const amount = Number(document.getElementById("amount").value);

    transfer(user, beneficiaryAccount, amount);
}
/*
  function func1(number,callback){
    console.log("start function");
     if(number%2===0){
    console.log("start callback");
    callback(number);
    console.log("end callback");
     }else{
        
     }
     console.log("end function");
  }

  function produit(number){
    console.log("the result is : ", (number*number));
  }

  func1(4,produit);
  */
