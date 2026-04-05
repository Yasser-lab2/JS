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
const rechargeSourceCard = document.getElementById("rechargeSourceCard");
const submitTransferBtn=document.getElementById("submitTransferBtn");
const rechargeBtn=document.getElementById("quickTopup");
const rechargeSection=document.getElementById("rechargePopup");
const closeRechargeBtn=document.getElementById("closeRechargeBtn");
const cancelRechargeBtn=document.getElementById("cancelRechargeBtn");
const submitRechargeBtn=document.getElementById("submitRechargeBtn");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
  transferBtn.addEventListener("click", handleTransfersection);
  closeTransferBtn.addEventListener("click", closeTransfer);
  cancelTransferBtn.addEventListener("click", closeTransfer);
  submitTransferBtn.addEventListener("click",handleTransfer);
  rechargeBtn.addEventListener("click", handleRechargeSection);
  closeRechargeBtn.addEventListener("click", closeRecharge);
  cancelRechargeBtn.addEventListener("click", closeRecharge);
  submitRechargeBtn.addEventListener("click", handleRecharge);


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
    <div>${transaction.etat}</div>
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

// Recharge popup
  function handleRechargeSection() {
  rechargeSection.classList.add("active");
  document.body.classList.add("popup-open");
}
function closeRecharge() {
  rechargeSection.classList.remove("active");
  document.body.classList.remove("popup-open");
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

        const rechargeOption = document.createElement("option");
        rechargeOption.value = card.numcards;
        rechargeOption.textContent = card.type+"****"+card.numcards;
        rechargeSourceCard.appendChild(rechargeOption);
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
async function transfer(expediteur, numcompte, amount) {
    console.log("DÉBUT DU TRANSFERT...");

    try {
        const destinataire = await checkUser(numcompte);
        console.log("Étape 1: Destinataire trouvé -", destinataire.name);

        const soldemessage = await checkSolde(expediteur, amount);
        console.log("Étape 2:", soldemessage);

        const updatemessage = await updateSolde(expediteur, destinataire, amount);
        console.log("Étape 3:", updatemessage);

        const addtransactionMessage = await addtransactions(expediteur, destinataire, amount);
        console.log("Étape 4:", addtransactionMessage);
        console.log(`Transfert de ${amount} MAD réussi!`);

        renderDashboard();
    } catch (erreur) {
        console.error("Échec du transfert :", erreur);
    }
}

function handleTransfer(e) {
    e.preventDefault();
    const beneficiaryId = document.getElementById("beneficiary").value;
    const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
    
    const amount = Number(document.getElementById("amount").value);
    
    transfer(user, beneficiaryAccount, amount);
}

function checkRechargeUser() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (user && user.wallet) {
                resolve(user);
            } else {
                reject("User not authenticated");
            }
        }, 200);
    });
}

function checkCard(cardNum) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const card = user.wallet.cards.find(c => c.numcards === cardNum);
            if (card) {
                resolve(card);
            } else {
                reject("Card not found");
            }
        }, 2000);
    });
}


function effectuer_recharge(amount, card) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            card.balance += amount;
            user.wallet.balance += amount;
            resolve("Recharge successful");
        }, 2000);
    });
}
function addRechargeTransaction(amount, etat = "success") {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const dateStr = new Date().toLocaleString();
            const transaction = {
                id: Date.now(),
                type: "Recharge",
                amount: amount,
                date: dateStr,
                from: "Recharge",
                etat: etat,
            };
            user.wallet.transactions.push(transaction);
            resolve("Recharge transaction added");
        }, 2000);
});
}
function validateRechargeAmount(amount) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (amount >= 10 && amount <= 5000) {
                resolve("Valid amount");
            } else {
                reject("Invalid amount");
            }
        }, 500);
    });
}

async function recharge(amount, cardNum) {
    console.log("DÉBUT DE LA RECHARGE...");

    try {
        await checkRechargeUser();
        const validationMessage = await validateRechargeAmount(amount);
        console.log("Validation montant:", validationMessage);

        const card = await checkCard(cardNum);
        console.log("Étape 1: Carte trouvée -", card.type + "****" + card.numcards);

        const rechargeMessage = await effectuer_recharge(amount, card);
        console.log("Étape 2:", rechargeMessage);

        const addTransactionMessage = await addRechargeTransaction(amount);
        console.log("Étape 3:", addTransactionMessage);
        console.log(`Recharge de ${amount} MAD réussie!`);

        renderDashboard();
    } catch (erreur) {
        console.error("Échec de la recharge :", erreur);
        try {
            await addRechargeTransaction(amount, "failed");
            renderDashboard();
        } catch (transactionError) {
            console.error("Échec d'enregistrement de la transaction échouée :", transactionError);
        }
    }
}

function handleRecharge(e){
    e.preventDefault();
    const cardNum = document.getElementById("rechargeSourceCard").value;
    const rechargeAmountInput = document.getElementById("rechargeAmount");
    const amount = Number(rechargeAmountInput.value);
    closeRecharge();
    recharge(amount, cardNum);
}

//the cards should be displayed



// function handleRecharge(e){
//     e.preventDefault();
//     const cardNum = document.getElementById("sourceCard").value;
//     const amount = Number(document.getElementById("rechargeAmount").value);
//     const card = user.wallet.cards.find(c => c.numcards === cardNum);
//     if (card) {
//         card.balance += amount;
//         user.wallet.balance += amount;
//         const dateStr = new Date().toLocaleString();
//         const transaction = {
//             id: Date.now(),
//             type: "credit",
// amount: amount,
// date: dateStr,
//             from: "Recharge",
//         };
//         user.wallet.transactions.push(transaction);
//         alert("Recharge successful!");
//         renderDashboard();
//     } else {
//         alert("Card not found!");
//     }
// } 

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
