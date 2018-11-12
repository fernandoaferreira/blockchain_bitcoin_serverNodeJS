const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');

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

    const { amount, sender, recipient } = req.body;

    console.log('amount:', amount, 'sender: ', sender, 'recipient: ', recipient);

    try {
        const blockIndex = bitcoin.createNewTransaction(amount, sender, recipient);

        res.status(200).json(`Transação colocada no bloco ${blockIndex}`);

    } catch (erro) {

        res.status(500).send(erro);

    }

});

app.get('/minerar', function (req, res) {

    try {
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

        //recopensa para quem mineirar o bloco
        bitcoin.createNewTransaction(12.5, '00', nodeAddress);

        //criar o novo bloco com as informações corretas
        const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

        res.status(200)
            .json({
                mensagem: 'Novo Bloco Mineirado com sucesso',
                Bloco: newBlock
            });

    } catch (erro) {
        res.status(500)
            .json({
                mensagem: 'Falha ao minerar Bloco',
                erro: erro
            });
    }
});

app.listen(3000, function () {
    console.log('Servidos Blockchain online ...')
});