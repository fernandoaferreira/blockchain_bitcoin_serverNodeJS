const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();


console.log(bitcoin);

// const previousBlockHash = 'FD65FD5F4SD5F4SD5F'

// const currentBlockData = [
//     {
//         amount: 10,
//         sender: 'ER5T46D5G4D65FG4',
//         recipient: 'F4D6S5F4S65DF4S'
//     },
//     {
//         amount: 20,
//         sender: 'ER5T46D5G4D65FG4',
//         recipient: 'F4D6S5F4S65DF4S'
//     },
//     {
//         amount: 30,
//         sender: 'ER5T46D5G4D65FG4',
//         recipient: 'F4D6S5F4S65DF4S'
//     },
// ];

// console.log('nonce com 4 numeros 0:', bitcoin.proofOfWork(previousBlockHash, currentBlockData));

// console.log('fazendo a hash correta: ', bitcoin.hashBlock(previousBlockHash, currentBlockData, 51064));

