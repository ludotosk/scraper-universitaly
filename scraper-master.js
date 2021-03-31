const puppeteer = require('puppeteer');
const fs = require('fs');

const inizio = Date.now();

var array = []

async function main(page, tipo_laurea) {
    await page.setRequestInterception(true);

    //if the page makes a  request to a resource type of image or stylesheet then abort that request
    page.on('request', request => {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'media')
            request.abort();
        else
            request.continue();
    });

    await page.goto('https://www.universitaly.it/index.php/public/cercaOffPL');

    await page.evaluate(tipo_laurea => {
        document.querySelector('#tipo_laurea').value = tipo_laurea;
    }, tipo_laurea);

    await page.click('.btn-form')

    await page.waitForSelector('#ui-accordion-colonna-dx-panel-1 > table > tbody > tr > td:nth-child(4)')

    console.log('caricato ' + tipo_laurea)    

    const risultati = await page.evaluate(() => {
        const linee = document.querySelectorAll('tr');
        var array = [];
        var uni = ''

        for (let i = 0; i < linee.length; i++) {
            const universita = linee[i].querySelectorAll('h3')[0]
            if (universita) {
                uni = universita.textContent
                if (uni == 'LUM "Jean Monnet"') {
                    uni = 'Libera università mediterranea Giuseppe Degennaro'
                }
                if (uni == 'Università degli Studi di BOLOGNA') {
                    uni = 'Alma mater studiorum Università di Bologna'
                }
            } else {
                const corsoObj = linee[i].querySelectorAll('b')[0]
                if (corsoObj) {
                    let corso = corsoObj.innerText.replaceAll('\"','').toLowerCase()
                    corso = corso.charAt(0).toUpperCase() + corso.slice(1)

                    const testo = linee[i].textContent
                    var citta = /(?<=, )[A-Z']+ [A-Z']+ [A-Z']+(?=  )|(?<=, )[A-Z']+(?=  )|(?<=, )[A-Z']+ [A-Z']+(?=  )|(?<=, )[A-Z']+ [A-Z']+ [A-Z']+ [A-Z']+(?=  )|(?<=, )[A-Z']+ - [A-Z']+(?=  )/gm.exec(testo)

                    citta = citta[0]

                    const durata = linee[i].getElementsByClassName('icona')[2].getElementsByTagName('img')[0].getAttribute('title').slice(8)

                    var lingua = linee[i].getElementsByClassName('icona')[3].getElementsByTagName('img')[0].getAttribute('title').slice(8)
                    //lingua = lingua.charAt(0) + lingua.charAt(1)

                    const link = linee[i].getElementsByTagName('a')[1].href

                    const tipo = linee[i].getElementsByTagName('i')[0].textContent

                    array.push({ uni, corso, citta, durata, lingua, link, tipo })
                }
            }
        }

        return array;
    });

    page.close();

    console.log('lunghezza risultati: ' + risultati.length)

    array = array.concat(risultati)
}

async function laucnhScrape() {
    const browser = await puppeteer.launch({ headless: true });
    const pagePrimo = await browser.newPage();
    const pageSecondo = await browser.newPage();
    const pageCorsi = await browser.newPage();

    console.log('tabelle caricate')

    await Promise.all([main(pagePrimo, 'M1'), main(pageSecondo, 'M2'), main(pageCorsi, 'CP')])

    console.log('numero di corsi: ' + array.length)

    browser.close();

    fs.writeFile('./master.json', JSON.stringify(array), function (err) {
        if (err) return console.log(err);
        console.log('master > master.json');
        const fine = (Date.now() - inizio) / 1000;
        console.log('tempo in secondi', fine);
        process.exit();
    });

}

laucnhScrape()