/*const express = require('express');
const faker = require('faker');
const app = express();

app.use(express.json());
const destinos = ['Madrid', 'Buenos Aires', 'San Pablo', 'Miami', 'Berlin'];

let viajes= [];
app.get('/viajes', (req, res) => {
    for(let i=0; i<20; i++){
        let viaje = {
            apellido: faker.name.lastName(),
            destino: faker.random.arrayElement(destinos),
            fechaIda: faker.date.future().toISOString().split('T')[0],
            fechaVuelta: faker.date.future().toISOString().split('T')[0]
        };
        viajes.push(viaje);
    }
 
    viajes.sort((a, b) => a.destino.localeCompare(b.destino));
    res.json(viajes);
});

app.get('/viajes/:destino', (req, res) => {
    let viajesFiltrados = viajes.filter(viaje => viaje.destino === req.params.destino);
    res.json(viajesFiltrados);
});

app.post('/viajeNuevo', (req, res) => {
    const { apellido, destino, fechaIda, fechaVuelta } = req.body;
    if (!apellido || !destino || !fechaIda || !fechaVuelta) {
        res.status (400).send('Datos incompletos');
        return;
    }
    let viajeNuevo = { apellido, destino, fechaIda, fechaVuelta };
    viajes.push(viajeNuevo);
    res.status(200).send(`Nuevo viaje agregado: Apellido - ${apellido}, Destino - ${destino}, Fecha de ida - ${fechaIda}, Fecha de vuelta - ${fechaVuelta}`);
});

app.delete('/viajeCancelado', (req, res) => {
    const { apellido, destino, fechaIda, fechaVuelta } = req.body;
    if (!apellido || !destino || !fechaIda || !fechaVuelta) {
        res.status(400).send('Datos incompletos');
        return;
    }
    res.status(200).send(`Viaje cancelado: Apellido - ${apellido}, Destino - ${destino}, Fecha de ida - ${fechaIda}, Fecha de vuelta - ${fechaVuelta}`);
});

app.listen(3000);
console.log("Servidor en puerto 3000");*/

require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const faker = require('faker');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const uri = 
"mongodb+srv://bruno2003H:M1piru_24_@proyecto.sihwm66.mongodb.net/?retryWrites=true&w=majority&appName=proyecto";
const client = new MongoClient(uri);

const destinos = ['Madrid', 'Buenos Aires', 'San Pablo', 'Miami', 'Berlin'];

let viajes = [];
async function generarViajes(){
for(let i=0; i<20; i++){
    let ciudad = faker.random.arrayElement(destinos);
    let IATA;
    try{
        await client.connect();
        const database = client.db('viajes');
        const collection = database.collection('destino');
        let destino = await collection.findOne({ciudad: ciudad});
        IATA = destino ? destino.IATA : 'No disponible';
    } finally {
        await client.close();
    }
    let viaje = {
        apellido: faker.name.lastName(),
        destino: ciudad,
        codigoIATA: IATA,
        fechaIda: faker.date.future().toISOString().split('T')[0],
        fechaVuelta: faker.date.future().toISOString().split('T')[0]
    };
    viajes.push(viaje);
}}
generarViajes();

app.post('/viajeNuevo', async (req, res) => {
    const { apellido, destino, fechaIda, fechaVuelta } = req.body;
    if (!apellido || !destino || !fechaIda || !fechaVuelta) {
        res.status(400).send('Datos incompletos');
        return;
    }
    let IATA;
    try{
        await client.connect();
        const database = client.db('viajes');
        const collectionDestino = database.collection('destino');
        let destinoDB = await collectionDestino.findOne({ciudad : destino});
        IATA = destinoDB ? destinoDB.IATA : 'No disponible';
    } finally{
        await client.close();
    }
    let viajeNuevo = { apellido, destino, IATA, fechaIda, fechaVuelta };
    try {
        await client.connect();
        const database = client.db('viajes');
        const collectionViaje = database.collection('viaje');

        // Inserta el nuevo viaje en la base de datos
        await collectionViaje.insertOne(viajeNuevo);

        res.status(200).send(`Nuevo viaje agregado: Apellido - ${apellido}, Destino - ${destino},Codigo aeropuerto - ${IATA}, Fecha de ida - ${fechaIda}, Fecha de vuelta - ${fechaVuelta}`);
    } finally {
        await client.close();
    }
});

app.get('/viajes', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('viajes');
        const collection = database.collection('viaje');
        const viajesDB = await collection.find().toArray();
        res.json(viajesDB);
    } finally {
        await client.close();
    }
});

app.get('/viajes/:destino', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('viajes');
        const collection = database.collection('viaje');
        const viajesFiltrados = await collection.find({ destino: req.params.destino }).toArray();
        res.json(viajesFiltrados);
    } finally {
        await client.close();
    }
});

app.delete('/viajeCancelado', async (req, res) => {
    const { apellido, destino, fechaIda, fechaVuelta } = req.body;
    if (!apellido || !destino || !fechaIda || !fechaVuelta) {
        res.status(400).send('Datos incompletos');
        return;
    }
    let codigoIATA;
    try {
        await client.connect();
        const database = client.db('viajes');
        const collectionDestino = database.collection('destino');
        let destinoDB = await collectionDestino.findOne({ ciudad: destino });
        codigoIATA = destinoDB ? destinoDB.codigoIATA : 'No disponible';
    } finally {
        await client.close();
    }
    try {
        await client.connect();
        const database = client.db('viajes');
        const collectionViaje = database.collection('viaje');
        await collectionViaje.deleteOne({ apellido, destino,IATA , fechaIda, fechaVuelta });
        res.status(200).send(`Viaje cancelado: Apellido - ${apellido}, Destino - ${destino}, Codigo aeropuerto - ${IATA}, Fecha de ida - ${fechaIda}, Fecha de vuelta - ${fechaVuelta}`);
    } finally {
        await client.close();
    }
});

app.listen(3000);
console.log("Servidor en puerto 3000");
module.exports = app;
