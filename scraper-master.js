const puppeteer = require('puppeteer');
const fs = require('fs');

const inizio = Date.now();

var array = []

var pagePrimo
var pageSecondo

async function main(page) {

    const risultati = await page.evaluate(() => {
        const linee = document.querySelectorAll('tr');
        var array = [];
        var uni = ''

        for (let i = 0; i < linee.length; i++) {
            const universita = linee[i].querySelectorAll('h3')[0]
            if (universita) {
                uni = universita.textContent
            } else {
                const corsoObj = linee[i].querySelectorAll('b')[0]
                if (corsoObj) {
                    let corso = corsoObj.innerText

                    const testo = linee[i].textContent
                    var citta = /(?<=, )[A-Z']+ [A-Z']+ [A-Z']+(?=  )|(?<=, )[A-Z']+(?=  )|(?<=, )[A-Z']+ [A-Z']+(?=  )|(?<=, )[A-Z']+ [A-Z']+ [A-Z']+ [A-Z']+(?=  )|(?<=, )[A-Z']+ - [A-Z']+(?=  )/gm.exec(testo)

                    citta = citta[0]

                    const durata = linee[i].getElementsByClassName('icona')[2].getElementsByTagName('img')[0].getAttribute('title')

                    const lingua = linee[i].getElementsByClassName('icona')[3].getElementsByTagName('img')[0].getAttribute('title')

                    const link = linee[i].getElementsByTagName('a')[1].href

                    const tipo = linee[i].getElementsByTagName('i')[0].textContent

                    array.push({ uni, corso, citta, durata, lingua, link, tipo })
                }
            }
        }

        return array;
    });

    page.close();

    array = array.concat(risultati)
    //return risultati;
}

async function apriM1() {
    await pagePrimo.setRequestInterception(true);

    //if the page makes a  request to a resource type of image or stylesheet then abort that request
    pagePrimo.on('request', request => {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'media')
            request.abort();
        else
            request.continue();
    });

    await pagePrimo.goto('https://www.universitaly.it/index.php/public/cercaOffPL');

    await pagePrimo.evaluate(() => {
        document.querySelector('#tipo_laurea').value = 'M1';
    });

    await pagePrimo.click('.btn-form');

    await pagePrimo.waitForSelector('#ui-accordion-colonna-sx-header-0')

    console.log('caricato primo livello')
}

async function apriM2() {
    await pageSecondo.setRequestInterception(true);

    //if the page makes a  request to a resource type of image or stylesheet then abort that request
    pageSecondo.on('request', request => {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'media')
            request.abort();
        else
            request.continue();
    });

    await pageSecondo.goto('https://www.universitaly.it/index.php/public/cercaOffPL');

    await pageSecondo.evaluate(() => {
        document.querySelector('#tipo_laurea').value = 'M2';
    });

    await pageSecondo.click('.btn-form');

    await pageSecondo.waitForSelector('#ui-accordion-colonna-sx-header-0')

    console.log('caricato secondo livello')

    //return Promise.resolve;
}

async function laucnhScrape() {
    const browser = await puppeteer.launch({ headless: true, });
    pagePrimo = await browser.newPage();
    pageSecondo = await browser.newPage();

    console.log('pagine create')

    await Promise.all([apriM1(), apriM2()])

    console.log('tabelle caricate')

    await Promise.all([main(pagePrimo), main(pageSecondo)])

    console.log('dati presi')

    browser.close();

    fs.writeFile('./src/master.json', JSON.stringify(array), function (err) {
        if (err) return console.log(err);
        console.log('master > master.json');
        const fine = (Date.now() - inizio) / 1000;
        console.log('tempo in secondi', fine);
        process.exit();
    });

}

laucnhScrape()

