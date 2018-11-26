const sha256 = require('sha256');
const conexaoAtualUrl = process.argv[3];
const uuid = require('uuid/v1');

function Blockchain() {

    this.chain = []; // todos os blocos mineirados na cadeia ficaram nesse array
    this.pedingTransactions = []; // novas transações antes de serem colocadas no bloco

    this.conexaoAtualUrl = conexaoAtualUrl;
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0');
};

//Criação de um novo Bloco (cadeia)
Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {

    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pedingTransactions, //se houver item transação pendente acrescenta no bloco
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    }

    this.pedingTransactions = [] // após colocar a transação no NewBlock ele apaga a transação perndente
    this.chain.push(newBlock); //adiciona o novo bloco na cadeia

    return newBlock;
};

//Get ultimo bloco da cadeia
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
};

//Cria uma nova transação
Blockchain.prototype.createNewTransaction = function (tamanho, remetente, destinatario) {

    const newTransaction = {
        amount: tamanho,
        sender: remetente,
        recipient: destinatario,
        transactionId: uuid().split('-').join('')
    };

    return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {

    this.pedingTransactions.push(transactionObj);

    return this.getLastBlock()['index'] + 1;
};

//Criar um Hash com dados do bloco
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {

    const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);

    const hash = sha256(dataString);

    return hash;
};

//Criar um nonce que converta os dados num hash que inicia com 4 numeros 0
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {

    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    console.log('Hash criada:', hash);
    //incrementa o nonce até ser um numero que gere um hash com 4 numeros zeros
    return nonce;
};

module.exports = Blockchain;
