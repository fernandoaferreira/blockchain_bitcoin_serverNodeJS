const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rq = require('request-promise');

//String ID unica desse Processo de Rede Node
const nodeAddress = uuid().split('-').join('');

//Iniciando o Objeto Bitcoin
const bitcoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/blockchain', function (req, res) {

    res.status(200).send(bitcoin);

});

app.post('/transaction', function (req, res) {

    const newTransaction = req.body;

    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);

    res.json({ note: `Transaçõ adicionada no bloco ${blockIndex}` });

});

app.post('/transaction/broadcast', function (req, res) {

    const { amount, sender, recipient } = req.body;

    const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);

    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };

        requestPromises.push(rq(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ msg: 'Transação broadcast criada com sucesso' });
        });

});

app.get('/minerar', function (req, res) {

    // Trazer o ultimo bloco
    const lastBlock = bitcoin.getLastBlock();

    //traz o hash do ultimo bloco
    const previousBlockHash = lastBlock['hash'];

    //Monta os dados do bloco atual
    const currentBlockData = {
        transactions: bitcoin.pedingTransactions, // coloca as trasações pendentes dentro do modulo
        index: lastBlock['index'] + 1
    };

    //Obter o nonce(numero) que ira gerar um hash com 4 numeros Zeros no inicio do hash
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);

    //Gerar o hash do bloco correto com 4 numeros zeros no inicio
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    //criar o novo bloco com as informações corretas
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/recieve-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };

        requestPromises.push(rq(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: bitcoin.conexaoAtualUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: "00",
                    recipient: nodeAddress
                },
                json: true
            };

            return rq(requestOptions);
        })
        .then(data => {
            res.status(200)
                .json({
                    mensagem: 'Novo Bloco Mineirado em broadcast com sucesso',
                    Bloco: newBlock
                });
        })


});

app.post('/recieve-new-block', function (req, res) {

    const { newBlock } = req.body;

    const lastBlock = bitcoin.getLastBlock();

    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pedingTransactions = [];

        res.json({
            note: 'Novo bloco recebido com sucesso',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'Novo bloco rejeitado.',
            newBlock: newBlock
        })
    }
});

//Registrar e transmitir o nó em toda rede
app.post('/register-and-broadcast-node', function (req, res) {

    //nova Url enviada pelo POST
    const { newNodeUrl } = req.body;

    //Se a nova URL não existir colocar no array networkNodes do bitcoin
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) bitcoin.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];

    /*Para cada Url enviar um Request para rota /register-Node 
    e colocar as promisses dentro do array*/
    bitcoin.networkNodes.forEach(networkNodeUrl => {

        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        };

        regNodesPromises.push(rq(requestOptions));
    });

    /*Resolver todas as promisses e enviar via Request 
    para a Rota '/register-nodes-bulk' registrar todos massa*/
    Promise.all(regNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.conexaoAtualUrl] },
                json: true
            };

            return rq(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: 'Novo nó registrado com sucesso' })
        })

});

//Registrar um nó no nucleo da rede
app.post('/register-node', function (req, res) {

    const { newNodeUrl } = req.body;

    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.conexaoAtualUrl !== newNodeUrl;

    if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);

    res.status(200).json({ mensagem: 'Novo Node Url registrado com sucesso' });

});

//Registrar os nós em massa
app.post('/register-nodes-bulk', function (req, res) {

    const { allNetworkNodes } = req.body;

    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.conexaoAtualUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl)
    });

    res.status(200).json({ mensagem: 'Registro em massa realizado com sucesso' });

});

app.listen(port, function () {
    console.log(`Servidor Blockchain online na porta >> ${port}...`)
});